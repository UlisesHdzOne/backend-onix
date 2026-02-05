import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateCourseStatusDto } from './dto/update-course-status.dto';
import { UpdateCourseProgressDto } from './dto/update-course-progress.dto';
import { UpdateCourseStatusResponse } from './types/course.response';
import { COURSE_STATUS_TRANSITIONS } from './domain/course-status.transitions';
import { CourseLifecycleStatus, DrivenCourseStatus } from '@prisma/client';

@Controller('course')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}
  // ================================
  // CRUD PRINCIPAL
  // ================================

  @Post()
  async createCourse(@Body() dto: CreateCourseDto) {
    return this.courseService.createCourse(dto);
  }

  @Get()
  async findAllCourses(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('statusLifecycle') statusLifecycle?: CourseLifecycleStatus,
  ) {
    return this.courseService.findAllCourses(
      page,
      limit,
      search,
      isActive !== undefined ? isActive === 'true' : undefined,
      statusLifecycle,
    );
  }

  @Get('transitions/:status')
  getAllowedTransitions(@Param('status') status: DrivenCourseStatus) {
    return {
      from: status,
      allowed: COURSE_STATUS_TRANSITIONS[status] || [],
    };
  }

  @Patch(':id')
  async updateCourse(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCourseDto) {
    return this.courseService.updateCourse(id, dto);
  }

  @Delete(':id')
  async removeCourse(@Param('id', ParseIntPipe) id: number) {
    return this.courseService.removeCourse(id);
  }

  // ================================
  // MÉTODOS DE RELACIÓN CON DRIVEN
  // ================================

  @Get('drivens/:drivenId/courses')
  async findCoursesByDriven(
    @Param('drivenId', ParseIntPipe) drivenId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.courseService.findCoursesByDriven(drivenId, page, limit, search, isActive);
  }

  @Post(':courseId/driven/:drivenId')
  async assignCourseToDriven(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('drivenId', ParseIntPipe) drivenId: number,
  ) {
    return this.courseService.assignCourseToDriven(drivenId, courseId);
  }

  @Patch(':courseId/driven/:drivenId/status')
  async updateCourseStatus(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('drivenId', ParseIntPipe) drivenId: number,
    @Body() dto: UpdateCourseStatusDto,
  ) {
    return this.courseService.updateCourseStatus(drivenId, courseId, dto.status);
  }

  @Patch(':courseId/driven/:drivenId/progress')
  async updateCourseProgress(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('drivenId', ParseIntPipe) drivenId: number,
    @Body() dto: UpdateCourseProgressDto,
  ): Promise<UpdateCourseStatusResponse> {
    return this.courseService.updateCourseProgress(drivenId, courseId, dto.progress);
  }

  @Delete(':courseId/driven/:drivenId')
  async removeDrivenFromCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('drivenId', ParseIntPipe) drivenId: number,
  ) {
    return this.courseService.removeDrivenFromCourse(drivenId, courseId);
  }
}
