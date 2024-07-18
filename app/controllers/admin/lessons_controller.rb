class Admin::LessonsController < AdminController
  before_action :set_course

  def index
    @admin_lessons = @admin_course.lessons.order(:position)
  end

  private

  def set_course
    @admin_course = Course.find(params[:course_id])
  end
end
