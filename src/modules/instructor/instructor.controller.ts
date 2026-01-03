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
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { InstructorService } from './instructor.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { UpdateInstructorStatusDto } from './dto/update-instructor-status.dto';
import { InstructorStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('instructor')
export class InstructorController {
  constructor(
    private readonly instructorService: InstructorService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  create(@Body() dto: CreateInstructorDto) {
    return this.instructorService.createInstructor(dto);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: InstructorStatus,
  ) {
    return this.instructorService.findAllInstructors(page, limit, search, status);
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

  @Get('dropdown')
  getForDropdown() {
    return this.prisma.instructor.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }
}
