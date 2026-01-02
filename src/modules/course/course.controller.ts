import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateCourseStatusDto } from './dto/update-course-status.dto';
import { UpdateCourseProgressDto } from './dto/update-course-progress.dto';
import { UpdateCourseStatusResponse } from './types/course.response';
import { COURSE_STATUS_TRANSITIONS } from './domain/course-status.transitions';
import { CourseStatus } from '@prisma/client';

@Controller('course')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  async createCourse(@Body() dto: CreateCourseDto) {
    return this.courseService.createCourse(dto); // Crea un nuevo curso
  }

  @Get()
  async findAllCourses() {
    return this.courseService.findAllCourses(); // Obtiene todos los cursos
  }

  @Put(':id')
  async updateCourse(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCourseDto) {
    return this.courseService.updateCourse(id, dto); // Actualiza un curso existente
  }

  @Delete(':id')
  async removeCourse(@Param('id', ParseIntPipe) id: number) {
    return this.courseService.removeCourse(id); // Elimina un curso por su ID
  }

  @Post(':courseId/driven/:drivenId')
  async assignCourseToDriven(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('drivenId', ParseIntPipe) drivenId: number,
  ) {
    return this.courseService.assignCourseToDriven(drivenId, courseId); // Asigna un curso a un driven
  }

  @Delete(':courseId/driven/:drivenId')
  async removeDrivenFromCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('drivenId', ParseIntPipe) drivenId: number,
  ) {
    return this.courseService.removeDrivenFromCourse(drivenId, courseId); // Remueve un driven de un curso
  }

  @Patch(':courseId/driven/:drivenId/status')
  async updateCourseStatus(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('drivenId', ParseIntPipe) drivenId: number,
    @Body() dto: UpdateCourseStatusDto,
  ) {
    return this.courseService.updateCourseStatus(drivenId, courseId, dto.status); // Actualiza el estado de un driven en un curso
  }

  @Patch(':courseId/driven/:drivenId/progress')
  async updateCourseProgress(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('drivenId', ParseIntPipe) drivenId: number,
    @Body() dto: UpdateCourseProgressDto,
  ): Promise<UpdateCourseStatusResponse> {
    return this.courseService.updateCourseProgress(drivenId, courseId, dto.progress);
  }

  @Get('transitions/:status')
  getAllowedTransitions(@Param('status') status: CourseStatus) {
    return {
      from: status,
      allowed: COURSE_STATUS_TRANSITIONS[status] || [],
    };
  }
}
