import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { DrivenModule } from './modules/driven/driven.module';
import { ProfileModule } from './modules/profile/profile.module';
import { CourseModule } from './modules/course/course.module';

@Module({
  imports: [VehiclesModule, DrivenModule, ProfileModule, CourseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
