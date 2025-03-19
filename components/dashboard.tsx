"use client"

import { Bell, BookOpen, Calendar, ChevronDown, ClipboardList, Clock, FileText, GraduationCap, Home, LogOut, Menu, Search, User, Users } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"

// Define types for our data
type Student = {
  id: number
  name: string
  rank: string
  squadron: string
  year: number
  email: string
}

type Class = {
  id: number
  title: string
  description: string
  instructor: string
  room: string
}

type ClassSchedule = {
  id: number
  class_id: number
  day_of_week: number
  start_time: string
  end_time: string
  title?: string
  room?: string
  instructor?: string
  time?: string
  attendance?: number
  total?: number
}

type Absence = {
  id: number
  student_id: number
  class_id: number
  date: string
  status: "absent" | "authorized_leave" | "medical" | "unauthorized"
  notes: string
  name?: string
  rank?: string
  class_title?: string
}

type Assignment = {
  id: number
  title: string
  class_id: number
  description: string
  due_date: string
  class_title?: string
  status?: string
}

type Grade = {
  id: number
  student_id: number
  assignment_id: number
  grade: string
  percentage: number
  feedback: string
  submitted_at: string
  student_name?: string
  assignment_title?: string
  class_title?: string
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [todayClasses, setTodayClasses] = useState<ClassSchedule[]>([])
  const [recentAbsences, setRecentAbsences] = useState<Absence[]>([])
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([])
  const [recentGrades, setRecentGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState({
    students: true,
    classes: true,
    todayClasses: true,
    absences: true,
    assignments: true,
    grades: true,
    attendanceRate: true,
  })
  const [error, setError] = useState({
    students: false,
    classes: false,
    todayClasses: false,
    absences: false,
    assignments: false,
    grades: false,
    attendanceRate: false,
  })
  const [attendanceRate, setAttendanceRate] = useState({
    rate: 0,
    change: 0,
  })

  useEffect(() => {
    // Fetch all data when component mounts
    const fetchData = async () => {
      // Fetch students
      try {
        const studentsRes = await fetch("/api/students")
        if (!studentsRes.ok) throw new Error("Failed to fetch students")
        const studentsData = await studentsRes.json()
        setStudents(studentsData)
      } catch (err) {
        console.error("Error fetching students:", err)
        setError((prev) => ({ ...prev, students: true }))
      } finally {
        setLoading((prev) => ({ ...prev, students: false }))
      }

      // Fetch classes
      try {
        const classesRes = await fetch("/api/classes")
        if (!classesRes.ok) throw new Error("Failed to fetch classes")
        const classesData = await classesRes.json()
        setClasses(classesData)
      } catch (err) {
        console.error("Error fetching classes:", err)
        setError((prev) => ({ ...prev, classes: true }))
      } finally {
        setLoading((prev) => ({ ...prev, classes: false }))
      }

      // Fetch today's classes
      try {
        const scheduleRes = await fetch("/api/class-schedule?today=true")
        if (!scheduleRes.ok) throw new Error("Failed to fetch today's classes")
        const scheduleData = await scheduleRes.json()
        setTodayClasses(scheduleData)
      } catch (err) {
        console.error("Error fetching today's classes:", err)
        setError((prev) => ({ ...prev, todayClasses: true }))
      } finally {
        setLoading((prev) => ({ ...prev, todayClasses: false }))
      }

      // Fetch recent absences
      try {
        const absencesRes = await fetch("/api/absences?days=7")
        if (!absencesRes.ok) throw new Error("Failed to fetch recent absences")
        const absencesData = await absencesRes.json()
        setRecentAbsences(absencesData)
      } catch (err) {
        console.error("Error fetching recent absences:", err)
        setError((prev) => ({ ...prev, absences: true }))
      } finally {
        setLoading((prev) => ({ ...prev, absences: false }))
      }

      // Fetch upcoming assignments
      try {
        const assignmentsRes = await fetch("/api/assignments?upcoming=true&days=7")
        if (!assignmentsRes.ok) throw new Error("Failed to fetch upcoming assignments")
        const assignmentsData = await assignmentsRes.json()
        setUpcomingAssignments(assignmentsData)
      } catch (err) {
        console.error("Error fetching upcoming assignments:", err)
        setError((prev) => ({ ...prev, assignments: true }))
      } finally {
        setLoading((prev) => ({ ...prev, assignments: false }))
      }

      // Fetch recent grades
      try {
        const gradesRes = await fetch("/api/grades?recent=true")
        if (!gradesRes.ok) throw new Error("Failed to fetch recent grades")
        const gradesData = await gradesRes.json()
        setRecentGrades(gradesData)
      } catch (err) {
        console.error("Error fetching recent grades:", err)
        setError((prev) => ({ ...prev, grades: true }))
      } finally {
        setLoading((prev) => ({ ...prev, grades: false }))
      }

      // Fetch attendance rate
      try {
        const rateRes = await fetch("/api/attendance-rate")
        if (!rateRes.ok) throw new Error("Failed to fetch attendance rate")
        const rateData = await rateRes.json()
        setAttendanceRate(rateData)
      } catch (err) {
        console.error("Error fetching attendance rate:", err)
        setError((prev) => ({ ...prev, attendanceRate: true }))
      } finally {
        setLoading((prev) => ({ ...prev, attendanceRate: false }))
      }
    }

    fetchData()
  }, [])

  // Helper function to format date relative to today
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  // Helper function to format due date
  const formatDueDate = (dateString: string) => {
    const dueDate = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (dueDate.toDateString() === today.toDateString()) return "Today"
    if (dueDate.toDateString() === tomorrow.toDateString()) return "Tomorrow"

    const diffTime = Math.abs(dueDate.getTime() - today.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 7) return `In ${diffDays} days`
    return dueDate.toLocaleDateString()
  }

  // Format status for display
  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <MobileSidebar />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <Image
              src="/placeholder.svg?height=32&width=32"
              width={32}
              height={32}
              alt="RAF School Logo"
              className="h-8 w-8"
            />
            <h1 className="hidden text-lg font-bold text-[#003a88] md:inline-flex">RAF School Programme</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <form className="hidden md:block">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search..." className="w-64 bg-background pl-8 md:w-80" />
            </div>
          </form>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              3
            </span>
            <span className="sr-only">Notifications</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Image
                  src="/placeholder.svg?height=32&width=32"
                  width={32}
                  height={32}
                  alt="User"
                  className="h-6 w-6 rounded-full"
                />
                <span className="hidden md:inline-flex">Sqn Ldr Smith</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="flex flex-1">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-64 flex-col border-r bg-white md:flex">
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Home className="h-5 w-5 text-[#003a88]" />
              <span className="text-sm font-medium text-[#003a88]">Dashboard</span>
            </div>
            <Link href="/students" className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
              <Users className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium">Students</span>
            </Link>
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
              <BookOpen className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium">Classes</span>
            </div>
            <Link href="/attendance" className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
              <ClipboardList className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium">Attendance</span>
            </Link>
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
              <FileText className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium">Assignments</span>
            </div>
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
              <GraduationCap className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium">Grades</span>
            </div>
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
              <Calendar className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium">Schedule</span>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
              <LogOut className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium">Logout</span>
            </div>
          </div>
        </aside>
        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Welcome, Squadron Leader Smith</h1>
              <p className="text-slate-500">Here's an overview of your RAF School Programme</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading.students ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{students.length || 0}</div>
                  )}
                  <p className="text-xs text-muted-foreground">+2 from last week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading.classes ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{classes.length || 0}</div>
                  )}
                  <p className="text-xs text-muted-foreground">Across 4 subjects</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading.attendanceRate ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{attendanceRate.rate}%</div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {attendanceRate.change > 0 ? "+" : ""}
                    {attendanceRate.change}% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading.assignments ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{upcomingAssignments.length || 0}</div>
                  )}
                  <p className="text-xs text-muted-foreground">Due this week</p>
                </CardContent>
              </Card>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>Today's Classes</CardTitle>
                  <CardDescription>
                    {new Date().toLocaleDateString("en-GB", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading.todayClasses ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-12 w-12 rounded-md" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-2 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : error.todayClasses ? (
                    <div className="py-8 text-center text-muted-foreground">Failed to load today's classes</div>
                  ) : todayClasses.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">No classes scheduled for today</div>
                  ) : (
                    <div className="space-y-4">
                      {todayClasses.map((cls, i) => (
                        <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-[#003a88] text-white">
                            <Clock className="h-6 w-6" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{cls.title}</p>
                              <span className="text-sm text-muted-foreground">
                                {cls.time || `${cls.start_time?.substring(0, 5)} - ${cls.end_time?.substring(0, 5)}`}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground">{cls.room}</p>
                              <span className="text-sm font-medium">
                                {cls.attendance || 0}/{cls.total || 0} present
                              </span>
                            </div>
                            <Progress value={cls.total ? (cls.attendance! / cls.total) * 100 : 0} className="h-1.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Recent Absences</CardTitle>
                  <CardDescription>Students marked absent in the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading.absences ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : error.absences ? (
                    <div className="py-8 text-center text-muted-foreground">Failed to load recent absences</div>
                  ) : recentAbsences.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      No absences recorded in the last 7 days
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentAbsences.map((absence, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                            <User className="h-5 w-5 text-slate-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{absence.name}</p>
                              <span className="text-xs text-muted-foreground">{formatRelativeDate(absence.date)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground">{absence.class_title}</p>
                              <span
                                className={`text-xs font-medium ${
                                  absence.status === "unauthorized" ? "text-red-500" : "text-amber-500"
                                }`}
                              >
                                {formatStatus(absence.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Assignments</CardTitle>
                  <CardDescription>Assignments due in the next 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading.assignments ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                          <Skeleton className="h-12 w-2/3" />
                          <Skeleton className="h-12 w-1/4" />
                        </div>
                      ))}
                    </div>
                  ) : error.assignments ? (
                    <div className="py-8 text-center text-muted-foreground">Failed to load upcoming assignments</div>
                  ) : upcomingAssignments.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">No assignments due in the next 7 days</div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingAssignments.map((assignment, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-1">
                            <p className="font-medium">{assignment.title}</p>
                            <p className="text-sm text-muted-foreground">{assignment.class_title}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatDueDate(assignment.due_date)}</p>
                            <span
                              className={`text-xs ${
                                assignment.status === "Not Started" ? "text-red-500" : "text-amber-500"
                              }`}
                            >
                              {assignment.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Grade Updates</CardTitle>
                  <CardDescription>Latest grades posted in the last 14 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading.grades ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                          <Skeleton className="h-12 w-2/3" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-6 w-12" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : error.grades ? (
                    <div className="py-8 text-center text-muted-foreground">Failed to load recent grades</div>
                  ) : recentGrades.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">No grades posted in the last 14 days</div>
                  ) : (
                    <div className="space-y-4">
                      {recentGrades.map((grade, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-1">
                            <p className="font-medium">{grade.assignment_title}</p>
                            <p className="text-sm text-muted-foreground">{grade.class_title}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#003a88] text-sm font-bold text-white">
                                {grade.grade}
                              </div>
                              <span className="text-sm font-medium">{grade.percentage}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{formatRelativeDate(grade.submitted_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function MobileSidebar() {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <Image
            src="/placeholder.svg?height=32&width=32"
            width={32}
            height={32}
            alt="RAF School Logo"
            className="h-8 w-8"
          />
          <h1 className="text-lg font-bold text-[#003a88]">RAF School Programme</h1>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href="#" className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-[#003a88]">
          <Home className="h-5 w-5" />
          <span className="text-sm font-medium">Dashboard</span>
        </Link>
        <Link href="/students" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100">
          <Users className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium">Students</span>
        </Link>
        <Link href="#" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100">
          <BookOpen className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium">Classes</span>
        </Link>
        <Link href="/attendance" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100">
          <ClipboardList className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium">Attendance</span>
        </Link>
        <Link href="#" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100">
          <FileText className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium">Assignments</span>
        </Link>
        <Link href="#" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100">
          <GraduationCap className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium">Grades</span>
        </Link>
        <Link href="#" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100">
          <Calendar className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium">Schedule</span>
        </Link>
        <Separator className="my-2" />
        <Link href="#" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100">
          <LogOut className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium">Logout</span>
        </Link>
      </div>
    </div>
  )
}
