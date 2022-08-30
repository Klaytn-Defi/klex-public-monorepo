import { Contract } from 'ethers';

import * as expectEvent from '../../../test/expectEvent';
import { deploy, deployedAt } from '../../../contract';

import Vault from '../../vault/Vault';
import StablePool from './StablePool';
import VaultDeployer from '../../vault/VaultDeployer';
import TypesConverter from '../../types/TypesConverter';
import { RawStablePoolDeployment, StablePoolDeployment } from './types';

const NAME = 'Balancer Pool Token';
const SYMBOL = 'BPT';

export default {
  async deploy(params: RawStablePoolDeployment): Promise<StablePool> {
    const deployment = TypesConverter.toStablePoolDeployment(params);
    const vault = params.vault ?? (await VaultDeployer.deploy(TypesConverter.toRawVaultDeployment(params)));
    const pool = await (params.fromFactory ? this._deployFromFactory : this._deployStandalone)(deployment, vault);

    const { owner, tokens, amplificationParameter, swapFeePercentage } = deployment;
    const poolId = await pool.getPoolId();
    return new StablePool(pool, poolId, vault, tokens, amplificationParameter, swapFeePercentage, owner);
  },

  async _deployStandalone(params: StablePoolDeployment, vault: Vault): Promise<Contract> {
    const {
      tokens,
      amplificationParameter,
      swapFeePercentage,
      pauseWindowDuration,
      bufferPeriodDuration,
      from,
    } = params;

    return deploy('v2-pool-stable/MockStablePool', {
      args: [
        vault.address,
        NAME,
        SYMBOL,
        tokens.addresses,
        amplificationParameter,
        swapFeePercentage,
        pauseWindowDuration,
        bufferPeriodDuration,
        TypesConverter.toAddress(params.owner),
      ],
      from,
    });
  },

  async _deployFromFactory(params: StablePoolDeployment, vault: Vault): Promise<Contract> {
    const { tokens, amplificationParameter, swapFeePercentage, owner, from } = params;

    const factory = await deploy('v2-pool-stable/StablePoolFactory', { args: [vault.address], from });
    const tx = await factory.create(
      NAME,
      SYMBOL,
      tokens.addresses,
      amplificationParameter,
      swapFeePercentage,
      TypesConverter.toAddress(owner)
    );
    const receipt = await tx.wait();
    const event = expectEvent.inReceipt(receipt, 'PoolCreated');
    return deployedAt('v2-pool-stable/StablePool', event.args.pool);
  },
};
