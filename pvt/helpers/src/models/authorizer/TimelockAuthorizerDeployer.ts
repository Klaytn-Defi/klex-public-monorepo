import { ethers } from 'hardhat';

import { MONTH } from '../../time';
import { deploy } from '../../contract';
import { TimelockAuthorizerDeployment } from './types';

import TimelockAuthorizer from './TimelockAuthorizer';
import TypesConverter from '../types/TypesConverter';

export default {
  async deploy(deployment: TimelockAuthorizerDeployment): Promise<TimelockAuthorizer> {
    const admin = deployment.admin || deployment.from || (await ethers.getSigners())[0];
    const vault = TypesConverter.toAddress(deployment.vault);
    const rootTransferDelay = deployment.rootTransferDelay || MONTH;
    const args = [TypesConverter.toAddress(admin), vault, rootTransferDelay];
    const instance = await deploy('TimelockAuthorizer', { args });
    return new TimelockAuthorizer(instance, admin);
  },
};
