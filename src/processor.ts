import {assertNotNull} from '@subsquid/util-internal'
import {lookupArchive} from '@subsquid/archive-registry'
import {
    BlockHeader,
    DataHandlerContext,
    EvmBatchProcessor,
    EvmBatchProcessorFields,
    Log as _Log,
    Transaction as _Transaction,
} from '@subsquid/evm-processor'

export const ETH_USDC_ADDRESS = '0x7EA2be2df7BA6E54B1A9C70676f668455E329d29'.toLowerCase()

export const processor = new EvmBatchProcessor()
    .setGateway({
        url: lookupArchive('eth-mainnet'),
        requestTimeout: 10000
    })
    .setRpcEndpoint({
        url: assertNotNull(process.env.RPC_ENDPOINT),
        rateLimit: 10
    })
    .setFinalityConfirmation(75)
    .setFields({
        log: {
            transactionHash: true
        }
    })
    .setBlockRange({
        from: 12740001
    })
    .addLog({
        address: [ETH_USDC_ADDRESS]
    })

export type Fields = EvmBatchProcessorFields<typeof processor>
export type Block = BlockHeader<Fields>
export type Log = _Log<Fields>
export type Transaction = _Transaction<Fields>
export type ProcessorContext<Store> = DataHandlerContext<Store, Fields>
