import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Put,
  Delete,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { InstructorService } from './instructor.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { UpdateInstructorStatusDto } from './dto/update-instructor-status.dto';

@Controller('instructor')
export class InstructorController {
  constructor(private readonly instructorService: InstructorService) {}

  @Post()
  create(@Body() dto: CreateInstructorDto) {
    return this.instructorService.createInstructor(dto);
  }

  @Get()
  findAll() {
    return this.instructorService.findAllInstructors();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.instructorService.findOneInstructorById(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInstructorDto) {
    return this.instructorService.updateInstructor(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.instructorService.deleteInstructor(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInstructorStatusDto) {
    return this.instructorService.updateInstructorStatus(id, dto.status);
  }
}
