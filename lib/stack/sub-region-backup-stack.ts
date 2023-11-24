import * as backup from 'aws-cdk-lib/aws-backup';
import { Stack, StackProps, Aws, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface SubRegionBackupStackProps extends StackProps {
  keyArn: string;
  backupVaultName?: string;
  removalPolicy?: RemovalPolicy;
}

export class SubRegionBackupStack extends Stack {
  public readonly vault: backup.CfnBackupVault;

  public static readonly BACKUP_VAULT_ARN_OUTPUT_KEY = 'BackupVaultArn';

  constructor(scope: Construct, id: string, props: SubRegionBackupStackProps) {
    super(scope, id, props);

    const vaultName = props.backupVaultName ?? `backup-vault-${Aws.REGION}`;

    this.vault = new backup.CfnBackupVault(this, 'Vault', {
      backupVaultName: vaultName,
      encryptionKeyArn: props.keyArn,
    });
    this.vault.applyRemovalPolicy(props.removalPolicy);

    // クロスリージョン参照用
    new CfnOutput(this, SubRegionBackupStack.BACKUP_VAULT_ARN_OUTPUT_KEY, {
      value: this.vault.attrBackupVaultArn,
    });
  }
}
