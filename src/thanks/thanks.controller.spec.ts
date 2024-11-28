import { Test, TestingModule } from '@nestjs/testing';
import { ThanksController } from './thanks.controller';
import { ThanksService } from './thanks.service';

describe('ThanksController', () => {
  let controller: ThanksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThanksController],
      providers: [ThanksService],
    }).compile();

    controller = module.get<ThanksController>(ThanksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
