import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  JwtClientSystemGuard,
  RequestWithClientSystem,
} from '../common/jwt-client-system.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentOrchestrationService } from './payment-orchestration.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentOrchestrationService: PaymentOrchestrationService,
  ) {}

  @Post()
  @UseGuards(JwtClientSystemGuard)
  async create(
    @Req() request: RequestWithClientSystem,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentOrchestrationService.createPayment(
      request.clientSystem.id,
      dto,
    );
  }

  @Get(':publicId')
  async getByPublicId(@Param('publicId') publicId: string) {
    return this.paymentOrchestrationService.getByPublicId(publicId);
  }
}
