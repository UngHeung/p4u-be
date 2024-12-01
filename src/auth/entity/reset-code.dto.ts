import { BaseModel } from 'src/common/entity/base.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class ResetCode extends BaseModel {
  @Column({ type: 'varchar', length: 255 })
  account: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  code: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;
}
