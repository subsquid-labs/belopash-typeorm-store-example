import {TypeormDatabaseWithCache, StoreWithCache} from '@belopash/typeorm-store'
import {
    processor,
    ProcessorContext,
    Log,
    Block,
    ETH_USDC_ADDRESS
} from './processor'
import * as erc20abi from './abi/erc20'
import {Account, Transfer} from './model'

type Task = () => Promise<void>
type MappingContext = ProcessorContext<StoreWithCache> & { queue: Task[] }

processor.run(new TypeormDatabaseWithCache({supportHotBlocks: true}), async (ctx) => {
    const mctx: MappingContext = {
        ...ctx,
        queue: []
    }

    for (let block of ctx.blocks) {
        for (let log of block.logs) {
            if (log.address===ETH_USDC_ADDRESS) {
                if (log.topics[0]===erc20abi.events.Transfer.topic) {
                    await handleTransfer(mctx, block.header, log)
                }
            }
        }
    }

    // do I need to run ctx.store.commit() here? for best performance

    for (let task of mctx.queue) {
        await task()
    }
})

async function handleTransfer(mctx: MappingContext, block: Block, log: Log) {
    let {from, to, value} = erc20abi.events.Transfer.decode(log)
    const deferredFromAccount = mctx.store.defer(Account, from)
    const deferredToAccount = mctx.store.defer(Account, to)
    mctx.queue.push(async () => {
        const fromAccount = await deferredFromAccount.getOrInsert(createNewAccount)
        const toAccount = await deferredToAccount.getOrInsert(createNewAccount)
        fromAccount.balance -= value
        toAccount.balance += value
        await mctx.store.upsert(fromAccount)
        await mctx.store.upsert(toAccount)
        await mctx.store.insert(new Transfer({
            id: log.id,
            block: block.height,
            hash: log.transactionHash,
            value,
            from: fromAccount,
            to: toAccount
        }))
    })
}

function createNewAccount(address: string) {
    return new Account({
        id: address,
        address,
        balance: 0n
    })
}
