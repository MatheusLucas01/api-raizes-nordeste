import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../generated/prisma/client';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('pagamentos')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':orderId/process')
  @HttpCode(HttpStatus.OK)
  process(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: Role,
  ) {
    return this.paymentsService.processLatest(orderId, userId, role);
  }

  @Post(':orderId/retry')
  @HttpCode(HttpStatus.CREATED)
  retry(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: Role,
  ) {
    return this.paymentsService.retry(orderId, userId, role);
  }

  @Get(':orderId')
  list(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: Role,
  ) {
    return this.paymentsService.listByOrder(orderId, userId, role);
  }
}
