import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http, parseAbiItem } from 'viem';
import type { Abi } from 'viem';
import { base } from 'viem/chains';
import { getChainRpc } from '../../config/networks';
import { getFactoryAddresses } from '../../config/contracts';
import IdentityNFT_JSON from '../../frontend/deployments/abi/IdentityNFT.json';
import FactoryABI from '../../frontend/deployments/abi/IdentityNFTFactory.json';

const IdentityNFT_ABI = IdentityNFT_JSON as unknown as Abi;

const IdentityMintedEvent = parseAbiItem(
  'event IdentityMinted(address indexed to, uint256 indexed tokenId, uint8 period, uint256 expiry)',
);

export interface HolderInfo {
  owner: `0x${string}`;
  tokenId: bigint;
  collectionAddress: `0x${string}`;
  status: 0 | 1 | 2;
  expiry: bigint;
}

export function useAllGamePassHolders(chainId: number = 8453) {
  return useQuery({
    queryKey: ['all-game-pass-holders', chainId],
    queryFn: async (): Promise<HolderInfo[]> => {
      const addresses = getFactoryAddresses(chainId);
      const client = createPublicClient({
        chain: base,
        transport: http(getChainRpc(chainId)),
      });

      // Round 1: Get all collections from factory
      const collections = (await client.readContract({
        address: addresses.identityNFTFactory,
        abi: FactoryABI,
        functionName: 'getAllCollections',
      })) as `0x${string}`[];

      if (collections.length === 0) return [];

      // Round 2: Read IdentityMinted events to enumerate all minted tokens
      // This is more reliable than iterating tokenIds: handles any ID assignment scheme.
      const logArrays = await Promise.all(
        collections.map((addr) =>
          client.getLogs({
            address: addr,
            event: IdentityMintedEvent,
            fromBlock: 0n,
            toBlock: 'latest',
          }),
        ),
      );

      type TokenRef = { collection: `0x${string}`; tokenId: bigint };
      const tokenRefs: TokenRef[] = [];
      for (let ci = 0; ci < collections.length; ci++) {
        for (const log of logArrays[ci]) {
          if (log.args.tokenId !== undefined) {
            tokenRefs.push({ collection: collections[ci], tokenId: log.args.tokenId });
          }
        }
      }

      if (tokenRefs.length === 0) return [];

      // Round 3: ownerOf + statusOf for all tokenIds (interleaved pairs)
      const ownerAndStatusCalls = tokenRefs.flatMap(({ collection, tokenId }) => [
        { address: collection, abi: IdentityNFT_ABI, functionName: 'ownerOf', args: [tokenId] },
        { address: collection, abi: IdentityNFT_ABI, functionName: 'statusOf', args: [tokenId] },
      ]);

      const ownerAndStatusResults = await client.multicall({
        contracts: ownerAndStatusCalls,
        allowFailure: true,
      });

      type RawHolder = { collection: `0x${string}`; tokenId: bigint; owner: `0x${string}`; statusNum: number };
      const rawHolders: RawHolder[] = [];
      for (let i = 0; i < tokenRefs.length; i++) {
        const ownerResult = ownerAndStatusResults[i * 2];
        const statusResult = ownerAndStatusResults[i * 2 + 1];
        if (ownerResult.status !== 'success') continue;
        const owner = ownerResult.result as `0x${string}`;
        const statusNum =
          statusResult.status === 'success' ? Number(statusResult.result as bigint | number) : 0;
        rawHolders.push({
          collection: tokenRefs[i].collection,
          tokenId: tokenRefs[i].tokenId,
          owner,
          statusNum,
        });
      }

      if (rawHolders.length === 0) return [];

      // Round 4: expiryOfUser — one call per unique owner+collection pair
      const uniquePairs = Array.from(
        new Map(
          rawHolders.map(({ owner, collection }) => [`${owner}:${collection}`, { owner, collection }]),
        ).values(),
      );

      const expiryResults = await client.multicall({
        contracts: uniquePairs.map(({ owner, collection }) => ({
          address: collection,
          abi: IdentityNFT_ABI,
          functionName: 'expiryOfUser',
          args: [owner],
        })),
        allowFailure: true,
      });

      const expiryMap = new Map<string, bigint>();
      for (let i = 0; i < uniquePairs.length; i++) {
        const { owner, collection } = uniquePairs[i];
        const expiry =
          expiryResults[i].status === 'success' ? (expiryResults[i].result as bigint) : BigInt(0);
        expiryMap.set(`${owner}:${collection}`, expiry);
      }

      return rawHolders.map(({ owner, tokenId, collection, statusNum }) => ({
        owner,
        tokenId,
        collectionAddress: collection,
        status: (statusNum <= 2 ? statusNum : 0) as 0 | 1 | 2,
        expiry: expiryMap.get(`${owner}:${collection}`) ?? BigInt(0),
      }));
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: 1,
  });
}
