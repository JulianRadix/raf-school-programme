"use client"

import {
  Bell,
  BookOpen,
  Calendar,
  ChevronDown,
  ClipboardList,
  FileText,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Plus,
  Search,
  Trash,
  Users,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

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

type Student = {
  id: number
  name: string
  rank: string
  squadron: string
  year: number
  email: string
}

type Assignment = {
  id: number
  title: string
  class_id: number
  description: string
  due_date: string
  class_title?: string
}

type Class = {
  id: number
  title: string
  description: string
  instructor: string
  room: string
}

type GradeStats = {
  total: number
  average: number
  distribution: Array<{
    grade_letter: string
    count: number
  }>
  topStudents: Array<{
    id: number
    name: string
    average_grade: number
    assignments_count: number
  }>
}

export default function GradeManager() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [grades, setGrades] = useState<Grade[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [stats, setStats] = useState<GradeStats | null>(null)
  const [loading, setLoading] = useState({
    grades: true,
    students: true,
    assignments: true,
    classes: true,
    stats: true,
  })
  const [error, setError] = useState({
    grades: false,
    students: false,
    assignments: false,
    classes: false,
    stats: false,
  })
  const [filters, setFilters] = useState({
    studentId: "",
    assignmentId: "",
    classId: "",
  })
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false)
  const [newGrade, setNewGrade] = useState({
    student_id: "",
    assignment_id: "",
    grade: "",
    percentage: "",
    feedback: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Fetch data on component mount
  useEffect(() => {
    fetchGrades()
    fetchStudents()
    fetchAssignments()
    fetchClasses()
    fetchStats()
  }, [])

  // Fetch grades when filters change
  useEffect(() => {
    fetchGrades()
  }, [filters])

  const fetchGrades = async () => {
    try {
      setLoading((prev) => ({ ...prev, grades: true }))

      let url = "/api/grades"
      const params = new URLSearchParams()

      if (filters.studentId) {
        params.append("studentId", filters.studentId)
      }

      if (filters.assignmentId) {
        params.append("assignmentId", filters.assignmentId)
      }

      if (filters.classId) {
        params.append("classId", filters.classId)
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch grades")

      const data = await res.json()
      setGrades(data)
      setError((prev) => ({ ...prev, grades: false }))
    } catch (err) {
      console.error("Error fetching grades:", err)
      setError((prev) => ({ ...prev, grades: true }))
    } finally {
      setLoading((prev) => ({ ...prev, grades: false }))
    }
  }

  const fetchStudents = async () => {
    try {
      setLoading((prev) => ({ ...prev, students: true }))

      const res = await fetch("/api/students")
      if (!res.ok) throw new Error("Failed to fetch students")

      const data = await res.json()
      setStudents(data)
      setError((prev) => ({ ...prev, students: false }))
    } catch (err) {
      console.error("Error fetching students:", err)
      setError((prev) => ({ ...prev, students: true }))
    } finally {
      setLoading((prev) => ({ ...prev, students: false }))
    }
  }

  const fetchAssignments = async () => {
    try {
      setLoading((prev) => ({ ...prev, assignments: true }))

      const res = await fetch("/api/assignments")
      if (!res.ok) throw new Error("Failed to fetch assignments")

      const data = await res.json()
      setAssignments(data)
      setError((prev) => ({ ...prev, assignments: false }))
    } catch (err) {
      console.error("Error fetching assignments:", err)
      setError((prev) => ({ ...prev, assignments: true }))
    } finally {
      setLoading((prev) => ({ ...prev, assignments: false }))
    }
  }

  const fetchClasses = async () => {
    try {
      setLoading((prev) => ({ ...prev, classes: true }))

      const res = await fetch("/api/classes")
      if (!res.ok) throw new Error("Failed to fetch classes")

      const data = await res.json()
      setClasses(data)
      setError((prev) => ({ ...prev, classes: false }))
    } catch (err) {
      console.error("Error fetching classes:", err)
      setError((prev) => ({ ...prev, classes: true }))
    } finally {
      setLoading((prev) => ({ ...prev, classes: false }))
    }
  }

  const fetchStats = async () => {
    try {
      setLoading((prev) => ({ ...prev, stats: true }))

      const res = await fetch("/api/grades/stats")
      if (!res.ok) throw new Error("Failed to fetch grade statistics")

      const data = await res.json()
      setStats(data)
      setError((prev) => ({ ...prev, stats: false }))
    } catch (err) {
      console.error("Error fetching grade statistics:", err)
      setError((prev) => ({ ...prev, stats: true }))
    } finally {
      setLoading((prev) => ({ ...prev, stats: false }))
    }
  }

  const handleGradeSelect = async (grade: Grade) => {
    try {
      const res = await fetch(`/api/grades/${grade.id}`)
      if (!res.ok) throw new Error("Failed to fetch grade details")

      const data = await res.json()
      setSelectedGrade(data)
      setGradeDialogOpen(true)
    } catch (err) {
      console.error("Error fetching grade details:", err)
      alert("Failed to load grade details. Please try again.")
    }
  }

  const handleAddNewGrade = () => {
    setIsEditing(false)
    setNewGrade({
      student_id: "",
      assignment_id: "",
      grade: "",
      percentage: "",
      feedback: "",
    })
    setGradeDialogOpen(true)
    setSelectedGrade(null)
  }

  const handleEditGrade = () => {
    if (!selectedGrade) return

    setIsEditing(true)
    setNewGrade({
      student_id: selectedGrade.student_id.toString(),
      assignment_id: selectedGrade.assignment_id.toString(),
      grade: selectedGrade.grade,
      percentage: selectedGrade.percentage.toString(),
      feedback: selectedGrade.feedback || "",
    })
  }

  const handleSaveGrade = async () => {
    try {
      setIsSaving(true)

      // Validate required fields
      if (!newGrade.student_id || !newGrade.assignment_id || !newGrade.grade || !newGrade.percentage) {
        alert("All fields except feedback are required")
        return
      }

      const gradeData = {
        student_id: Number.parseInt(newGrade.student_id),
        assignment_id: Number.parseInt(newGrade.assignment_id),
        grade: newGrade.grade.trim(),
        percentage: Number.parseFloat(newGrade.percentage),
        feedback: newGrade.feedback.trim() || null,
      }

      let res

      if (isEditing && selectedGrade) {
        // Update existing grade
        res = await fetch(`/api/grades/${selectedGrade.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(gradeData),
        })
      } else {
        // Create new grade
        res = await fetch("/api/grades", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(gradeData),
        })
      }

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to save grade")
      }

      // Refresh grade list and stats
      await fetchGrades()
      await fetchStats()

      // Close dialog
      setGradeDialogOpen(false)
    } catch (err) {
      console.error("Error saving grade:", err)
      alert(`Error: ${err instanceof Error ? err.message : "Failed to save grade"}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteGrade = async () => {
    if (!selectedGrade) return

    try {
      setIsDeleting(true)

      const res = await fetch(`/api/grades/${selectedGrade.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to delete grade")
      }

      // Refresh grade list and stats
      await fetchGrades()
      await fetchStats()

      // Close dialogs
      setDeleteDialogOpen(false)
      setGradeDialogOpen(false)
    } catch (err) {
      console.error("Error deleting grade:", err)
      alert(`Error: ${err instanceof Error ? err.message : "Failed to delete grade"}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
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
            <Link href="/" className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
              <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
                <Home className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-medium">Dashboard</span>
              </div>
            </Link>
            <Link href="/students" className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
                <Users className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-medium">Students</span>
              </div>
            </Link>
            <Link href="/classes" className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
              <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
                <BookOpen className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-medium">Classes</span>
              </div>
            </Link>
            <Link href="/attendance" className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
              <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
                <ClipboardList className="h-5 w-5" />
                <span className="text-sm font-medium">Attendance</span>
              </div>
            </Link>
            <Link href="/assignments" className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
              <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
                <FileText className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-medium">Assignments</span>
              </div>
            </Link>
            <Link href="/grades" className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
              <div className="flex items-center gap-2 px-2 py-1.5 text-[#003a88]">
                <GraduationCap className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-medium">Grades</span>
              </div>
            </Link>
            <Link href="/schedule" className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
              <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
                <Calendar className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-medium">Schedule</span>
              </div>
            </Link>
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
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Grade Management</h1>
                <p className="text-slate-500">View and manage grades in the RAF School Programme</p>
              </div>
              <Button onClick={handleAddNewGrade} className="mt-2 md:mt-0">
                <Plus className="mr-2 h-4 w-4" /> Add New Grade
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading.stats ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{stats?.total || 0}</div>
                  )}
                  <p className="text-xs text-muted-foreground">Grades recorded</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading.stats ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{stats?.average || 0}%</div>
                  )}
                  <p className="text-xs text-muted-foreground">Overall average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Grade Distribution</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading.stats ? (
                    <Skeleton className="h-8 w-full" />
                  ) : (
                    <div className="space-y-2">
                      {stats?.distribution?.map((item) => (
                        <div key={item.grade_letter} className="flex items-center justify-between">
                          <span className="text-sm font-medium">Grade {item.grade_letter}</span>
                          <span className="text-sm font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Top Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading.stats ? (
                    <Skeleton className="h-8 w-full" />
                  ) : (
                    <div className="space-y-2">
                      {stats?.topStudents?.slice(0, 3).map((student) => (
                        <div key={student.id} className="flex items-center justify-between">
                          <span className="text-sm truncate max-w-[150px]">{student.name}</span>
                          <span className="text-sm font-medium">{student.average_grade}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Grades</CardTitle>
                  <CardDescription>Manage all grades in the RAF School Programme</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
                      <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="student-filter" className="text-sm font-medium">
                            Student:
                          </Label>
                          <Select
                            value={filters.studentId}
                            onValueChange={(value) => setFilters({ ...filters, studentId: value })}
                          >
                            <SelectTrigger id="student-filter" className="w-[180px]">
                              <SelectValue placeholder="All Students" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Students</SelectItem>
                              {students.map((student) => (
                                <SelectItem key={student.id} value={student.id.toString()}>
                                  {student.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="class-filter" className="text-sm font-medium">
                            Class:
                          </Label>
                          <Select
                            value={filters.classId}
                            onValueChange={(value) => setFilters({ ...filters, classId: value })}
                          >
                            <SelectTrigger id="class-filter" className="w-[180px]">
                              <SelectValue placeholder="All Classes" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Classes</SelectItem>
                              {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id.toString()}>
                                  {cls.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {loading.grades ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : error.grades ? (
                      <div className="py-8 text-center text-muted-foreground">
                        Failed to load grades. Please try again.
                      </div>
                    ) : grades.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        No grades found. Try adjusting your filters or add a new grade.
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student</TableHead>
                              <TableHead>Assignment</TableHead>
                              <TableHead>Class</TableHead>
                              <TableHead>Grade</TableHead>
                              <TableHead className="hidden md:table-cell">Submitted</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {grades.map((grade) => (
                              <TableRow
                                key={grade.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handleGradeSelect(grade)}
                              >
                                <TableCell className="font-medium">{grade.student_name}</TableCell>
                                <TableCell>{grade.assignment_title}</TableCell>
                                <TableCell>{grade.class_title}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#003a88] text-xs font-bold text-white">
                                      {grade.grade}
                                    </div>
                                    <span>{grade.percentage}%</span>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">{formatDate(grade.submitted_at)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Grade Dialog */}
            <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    {selectedGrade ? (isEditing ? "Edit Grade" : "Grade Details") : "Add New Grade"}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedGrade
                      ? isEditing
                        ? "Update grade information"
                        : "View grade details"
                      : "Add a new grade to the RAF School Programme"}
                  </DialogDescription>
                </DialogHeader>

                {selectedGrade && !isEditing ? (
                  <GradeDetails
                    grade={selectedGrade}
                    onEdit={handleEditGrade}
                    onDelete={() => setDeleteDialogOpen(true)}
                  />
                ) : (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="student" className="text-right">
                        Student*
                      </Label>
                      <Select
                        value={newGrade.student_id}
                        onValueChange={(value) => setNewGrade({ ...newGrade, student_id: value })}
                        disabled={isEditing}
                      >
                        <SelectTrigger id="student" className="col-span-3">
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="assignment" className="text-right">
                        Assignment*
                      </Label>
                      <Select
                        value={newGrade.assignment_id}
                        onValueChange={(value) => setNewGrade({ ...newGrade, assignment_id: value })}
                        disabled={isEditing}
                      >
                        <SelectTrigger id="assignment" className="col-span-3">
                          <SelectValue placeholder="Select assignment" />
                        </SelectTrigger>
                        <SelectContent>
                          {assignments.map((assignment) => (
                            <SelectItem key={assignment.id} value={assignment.id.toString()}>
                              {assignment.title} ({assignment.class_title})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="grade" className="text-right">
                        Grade*
                      </Label>
                      <Input
                        id="grade"
                        value={newGrade.grade}
                        onChange={(e) => setNewGrade({ ...newGrade, grade: e.target.value })}
                        className="col-span-3"
                        placeholder="e.g., A, B+, C-"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="percentage" className="text-right">
                        Percentage*
                      </Label>
                      <Input
                        id="percentage"
                        type="number"
                        min="0"
                        max="100"
                        value={newGrade.percentage}
                        onChange={(e) => setNewGrade({ ...newGrade, percentage: e.target.value })}
                        className="col-span-3"
                        placeholder="e.g., 85"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="feedback" className="text-right pt-2">
                        Feedback
                      </Label>
                      <Textarea
                        id="feedback"
                        value={newGrade.feedback}
                        onChange={(e) => setNewGrade({ ...newGrade, feedback: e.target.value })}
                        className="col-span-3"
                        placeholder="Enter feedback for the student"
                        rows={4}
                      />
                    </div>
                  </div>
                )}

                <DialogFooter className="flex items-center justify-between">
                  {selectedGrade && !isEditing ? (
                    <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                      <Trash className="mr-2 h-4 w-4" /> Delete Grade
                    </Button>
                  ) : (
                    <div></div>
                  )}

                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setGradeDialogOpen(false)}>
                      Cancel
                    </Button>
                    {selectedGrade && !isEditing ? (
                      <Button onClick={handleEditGrade}>Edit</Button>
                    ) : (
                      <Button onClick={handleSaveGrade} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                    )}
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this grade? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteGrade} disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}

function GradeDetails({
  grade,
  onEdit,
  onDelete,
}: {
  grade: Grade
  onEdit: () => void
  onDelete: () => void
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">{grade.assignment_title}</h3>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#003a88] text-sm font-bold text-white">
              {grade.grade}
            </div>
            <span className="text-lg font-bold">{grade.percentage}%</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Class: {grade.class_title}</p>
        <p className="text-sm text-muted-foreground">Student: {grade.student_name}</p>
        <p className="text-sm text-muted-foreground">Submitted: {formatDate(grade.submitted_at)}</p>
      </div>

      <Separator />

      <div className="space-y-2">
        <h4 className="font-medium">Feedback</h4>
        {grade.feedback ? (
          <p className="text-sm">{grade.feedback}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No feedback provided</p>
        )}
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
        <Link href="/" className="flex items-center gap-2 rounded-md hover:bg-slate-100 px-3 py-2 ">
          <Home className="h-5 w-5" />
          <span className="text-sm font-medium">Dashboard</span>
        </Link>
        <Link href="/students" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100 ">
          <Users className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium">Students</span>
        </Link>
        <Link href="/classes" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100 ">
          <BookOpen className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium">Classes</span>
        </Link>
        <Link href="/attendance" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100">
          <ClipboardList className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium">Attendance</span>
        </Link>
        <Link href="/assignments" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100">
          <ClipboardList className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium">Assignments</span>
        </Link>
        <Link href="/grades" className="flex items-center gap-2 rounded-md px-3 py-2 bg-slate-100 text-[#003a88]">
          <FileText className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium">Grades</span>
        </Link>
        <Link href="/schedule" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100">
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



