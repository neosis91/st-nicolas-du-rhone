import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ContentService } from './content.service';
import { PublicController } from './public.controller';

@Module({
  controllers: [PublicController, AdminController],
  providers: [ContentService],
})
export class ContentModule {}
