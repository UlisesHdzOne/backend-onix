import { Controller, Get, Post, Body, Param, Put, Delete, Patch } from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseStatusType } from './type/course.types';

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

  @Get(':id')
  async findCourseById(@Param('id') id: number) {
    return this.courseService.findCourseById(id); // Obtiene un curso por su ID
  }

  @Put(':id')
  async updateCourse(@Param('id') id: number, @Body() dto: UpdateCourseDto) {
    return this.courseService.updateCourse(id, dto); // Actualiza un curso existente
  }

  @Delete(':id')
  async removeCourse(@Param('id') id: number) {
    return this.courseService.removeCourse(id); // Elimina un curso por su ID
  }

  @Post(':courseId/driven/:drivenId')
  async assignCourseToDriven(
    @Param('courseId') courseId: number,
    @Param('drivenId') drivenId: number,
  ) {
    return this.courseService.assignCourseToDriven(drivenId, courseId); // Asigna un curso a un driven
  }

  @Delete(':courseId/driven/:drivenId')
  async removeDrivenFromCourse(
    @Param('courseId') courseId: number,
    @Param('drivenId') drivenId: number,
  ) {
    return this.courseService.removeDrivenFromCourse(drivenId, courseId); // Remueve un driven de un curso
  }

  @Patch(':courseId/driven/:drivenId/status')
  async updateCourseStatus(
    @Param('courseId') courseId: number,
    @Param('drivenId') drivenId: number,
    @Body('status') status: CourseStatusType,
  ) {
    return this.courseService.updateCourseStatus(drivenId, courseId, status); // Actualiza el estado de un driven en un curso
  }
}
