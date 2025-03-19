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
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

type Class = {
  id: number
  title: string
  description: string
  instructor: string
  room: string
  created_at: string
  schedule?: ClassSchedule[]
  enrolled_count?: number
}

type ClassSchedule = {
  id: number
  class_id: number
  day_of_week: number
  start_time: string
  end_time: string
}

type ClassStats = {
  total: number
  topAttendance: Array<{
    id: number
    title: string
    student_count: number
    rate: number
  }>
  instructors: Array<{
    instructor: string
    count: number
  }>
}

type Student = {
  id: number
  name: string
  rank: string
  squadron: string
  year: number
  email: string
  status?: string
  date?: string
}

export default function ClassManager() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [stats, setStats] = useState<ClassStats | null>(null)
  const [loading, setLoading] = useState({
    classes: true,
    stats: true,
  })
  const [error, setError] = useState({
    classes: false,
    stats: false,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [classDialogOpen, setClassDialogOpen] = useState(false)
  const [newClass, setNewClass] = useState({
    title: "",
    description: "",
    instructor: "",
    room: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Fetch classes and stats on component mount
  useEffect(() => {
    fetchClasses()
    fetchStats()
  }, [])

  // Fetch classes when search query changes
  useEffect(() => {
    fetchClasses()
  }, [searchQuery])

  const fetchClasses = async () => {
    try {
      setLoading((prev) => ({ ...prev, classes: true }))

      let url = "/api/classes"
      if (searchQuery) {
        url += `?search=${encodeURIComponent(searchQuery)}`
      }

      const res = await fetch(url)
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

      const res = await fetch("/api/classes/stats")
      if (!res.ok) throw new Error("Failed to fetch class statistics")

      const data = await res.json()
      setStats(data)
      setError((prev) => ({ ...prev, stats: false }))
    } catch (err) {
      console.error("Error fetching class statistics:", err)
      setError((prev) => ({ ...prev, stats: true }))
    } finally {
      setLoading((prev) => ({ ...prev, stats: false }))
    }
  }

  const handleClassSelect = async (cls: Class) => {
    try {
      const res = await fetch(`/api/classes/${cls.id}`)
      if (!res.ok) throw new Error("Failed to fetch class details")

      const data = await res.json()
      setSelectedClass(data)
      setClassDialogOpen(true)
    } catch (err) {
      console.error("Error fetching class details:", err)
      alert("Failed to load class details. Please try again.")
    }
  }

  const handleAddNewClass = () => {
    setIsEditing(false)
    setNewClass({
      title: "",
      description: "",
      instructor: "",
      room: "",
    })
    setClassDialogOpen(true)
    setSelectedClass(null)
  }

  const handleEditClass = () => {
    if (!selectedClass) return

    setIsEditing(true)
    setNewClass({
      title: selectedClass.title,
      description: selectedClass.description || "",
      instructor: selectedClass.instructor || "",
      room: selectedClass.room || "",
    })
  }

  const handleSaveClass = async () => {
    try {
      setIsSaving(true)

      // Validate required fields
      if (!newClass.title.trim()) {
        alert("Class title is required")
        return
      }

      const classData = {
        title: newClass.title.trim(),
        description: newClass.description.trim() || null,
        instructor: newClass.instructor.trim() || null,
        room: newClass.room.trim() || null,
      }

      let res

      if (isEditing && selectedClass) {
        // Update existing class
        res = await fetch(`/api/classes/${selectedClass.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(classData),
        })
      } else {
        // Create new class
        res = await fetch("/api/classes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(classData),
        })
      }

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to save class")
      }

      // Refresh class list and stats
      await fetchClasses()
      await fetchStats()

      // Close dialog
      setClassDialogOpen(false)
    } catch (err) {
      console.error("Error saving class:", err)
      alert(`Error: ${err instanceof Error ? err.message : "Failed to save class"}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClass = async () => {
    if (!selectedClass) return

    try {
      setIsDeleting(true)

      const res = await fetch(`/api/classes/${selectedClass.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to delete class")
      }

      // Refresh class list and stats
      await fetchClasses()
      await fetchStats()

      // Close dialogs
      setDeleteDialogOpen(false)
      setClassDialogOpen(false)
    } catch (err) {
      console.error("Error deleting class:", err)
      alert(`Error: ${err instanceof Error ? err.message : "Failed to delete class"}`)
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

  const getDayName = (day: number): string => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    return days[day - 1] // Adjust for 1-based index
  }

  const formatTime = (timeString: string): string => {
    return timeString.substring(0, 5) // Format HH:MM
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
              <div className="flex items-center gap-2 px-2 py-1.5 text-[#003a88]">
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
              <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
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
                <h1 className="text-2xl font-bold text-slate-900">Class Management</h1>
                <p className="text-slate-500">View and manage classes in the RAF School Programme</p>
              </div>
              <Button onClick={handleAddNewClass} className="mt-2 md:mt-0">
                <Plus className="mr-2 h-4 w-4" /> Add New Class
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading.stats ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{stats?.total || 0}</div>
                  )}
                  <p className="text-xs text-muted-foreground">Active classes in the programme</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Top Attendance</CardTitle>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading.stats ? (
                    <Skeleton className="h-8 w-full" />
                  ) : (
                    <div className="space-y-2">
                      {stats?.topAttendance?.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <span className="text-sm truncate max-w-[150px]">{item.title}</span>
                          <span className="text-sm font-medium">{item.rate}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Instructors</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading.stats ? (
                    <Skeleton className="h-8 w-full" />
                  ) : (
                    <div className="space-y-2">
                      {stats?.instructors?.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm truncate max-w-[150px]">{item.instructor}</span>
                          <span className="text-sm font-medium">{item.count} classes</span>
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
                  <CardTitle>Classes</CardTitle>
                  <CardDescription>Manage all classes in the RAF School Programme</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex w-full items-center space-x-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search classes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-[300px]"
                      />
                    </div>

                    {loading.classes ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : error.classes ? (
                      <div className="py-8 text-center text-muted-foreground">
                        Failed to load classes. Please try again.
                      </div>
                    ) : classes.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        No classes found. Try adjusting your search or add a new class.
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Instructor</TableHead>
                              <TableHead>Room</TableHead>
                              <TableHead className="hidden md:table-cell">Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {classes.map((cls) => (
                              <TableRow
                                key={cls.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handleClassSelect(cls)}
                              >
                                <TableCell className="font-medium">{cls.title}</TableCell>
                                <TableCell>{cls.instructor || "-"}</TableCell>
                                <TableCell>{cls.room || "-"}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {cls.description
                                    ? cls.description.length > 50
                                      ? cls.description.substring(0, 50) + "..."
                                      : cls.description
                                    : "-"}
                                </TableCell>
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

            {/* Class Dialog */}
            <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    {selectedClass ? (isEditing ? "Edit Class" : "Class Details") : "Add New Class"}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedClass
                      ? isEditing
                        ? "Update class information"
                        : "View class details"
                      : "Add a new class to the RAF School Programme"}
                  </DialogDescription>
                </DialogHeader>

                {selectedClass && !isEditing ? (
                  <ClassDetails
                    classData={selectedClass}
                    onEdit={handleEditClass}
                    onDelete={() => setDeleteDialogOpen(true)}
                  />
                ) : (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="title" className="text-right">
                        Title*
                      </Label>
                      <Input
                        id="title"
                        value={newClass.title}
                        onChange={(e) => setNewClass({ ...newClass, title: e.target.value })}
                        className="col-span-3"
                        placeholder="e.g., Aviation Principles"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="instructor" className="text-right">
                        Instructor
                      </Label>
                      <Input
                        id="instructor"
                        value={newClass.instructor}
                        onChange={(e) => setNewClass({ ...newClass, instructor: e.target.value })}
                        className="col-span-3"
                        placeholder="e.g., Wg Cdr Johnson"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="room" className="text-right">
                        Room
                      </Label>
                      <Input
                        id="room"
                        value={newClass.room}
                        onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                        className="col-span-3"
                        placeholder="e.g., Room 12A"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="description" className="text-right pt-2">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={newClass.description}
                        onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                        className="col-span-3"
                        placeholder="Enter class description"
                        rows={4}
                      />
                    </div>
                  </div>
                )}

                <DialogFooter className="flex items-center justify-between">
                  {selectedClass && !isEditing ? (
                    <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                      <Trash className="mr-2 h-4 w-4" /> Delete Class
                    </Button>
                  ) : (
                    <div></div>
                  )}

                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setClassDialogOpen(false)}>
                      Cancel
                    </Button>
                    {selectedClass && !isEditing ? (
                      <Button onClick={handleEditClass}>Edit</Button>
                    ) : (
                      <Button onClick={handleSaveClass} disabled={isSaving}>
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
                    Are you sure you want to delete this class? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteClass} disabled={isDeleting}>
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

function ClassDetails({
  classData,
  onEdit,
  onDelete,
}: {
  classData: Class
  onEdit: () => void
  onDelete: () => void
}) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [attendanceStats, setAttendanceStats] = useState<any>(null)

  useEffect(() => {
    fetchClassStudents()
  }, [classData.id, selectedDate])

  const fetchClassStudents = async () => {
    try {
      setLoading(true)

      const res = await fetch(`/api/classes/${classData.id}/students?date=${selectedDate}`)
      if (!res.ok) throw new Error("Failed to fetch class students")

      const data = await res.json()
      setStudents(data.students || [])
      setAttendanceStats(data.stats)
      setError(false)
    } catch (err) {
      console.error("Error fetching class students:", err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const getDayName = (day: number): string => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    return days[day - 1] // Adjust for 1-based index
  }

  const formatTime = (timeString: string): string => {
    return timeString.substring(0, 5) // Format HH:MM
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <h3 className="text-xl font-bold">{classData.title}</h3>
        {classData.description && <p className="text-sm text-muted-foreground">{classData.description}</p>}
        <div className="flex flex-wrap gap-2 mt-2">
          {classData.instructor && (
            <div className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
              Instructor: {classData.instructor}
            </div>
          )}
          {classData.room && (
            <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
              Room: {classData.room}
            </div>
          )}
          {classData.enrolled_count !== undefined && (
            <div className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
              {classData.enrolled_count} Students Enrolled
            </div>
          )}
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="schedule">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <h4 className="text-sm font-medium">Class Schedule</h4>

          {!classData.schedule || classData.schedule.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">No schedule found for this class</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classData.schedule.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>{getDayName(schedule.day_of_week)}</TableCell>
                      <TableCell>{formatTime(schedule.start_time)}</TableCell>
                      <TableCell>{formatTime(schedule.end_time)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Schedule
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Students</h4>
            <div className="flex items-center space-x-2">
              <Label htmlFor="date-select" className="text-sm">
                Date:
              </Label>
              <Input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="py-4 text-center text-muted-foreground">Failed to load students. Please try again.</div>
          ) : students.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              No students found for this class on {formatDate(selectedDate)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{attendanceStats?.attendanceRate || 0}%</div>
                      <p className="text-xs text-muted-foreground">Attendance Rate</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{attendanceStats?.total_students || 0}</div>
                      <p className="text-xs text-muted-foreground">Total Students</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{attendanceStats?.present_count || 0}</div>
                      <p className="text-xs text-muted-foreground">Present</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{attendanceStats?.absent_count || 0}</div>
                      <p className="text-xs text-muted-foreground">Absent</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead>Squadron</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.rank || "-"}</TableCell>
                        <TableCell>{student.squadron || "-"}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                              student.status === "present"
                                ? "bg-green-100 text-green-800"
                                : student.status === "unauthorized"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {student.status ? formatStatus(student.status) : "-"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          <div className="flex justify-end">
            <Link href={`/attendance?classId=${classData.id}&date=${selectedDate}`}>
              <Button variant="outline" size="sm">
                Manage Attendance
              </Button>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
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
        <Link href="/classes" className="flex items-center gap-2 rounded-md px-3 py-2 bg-slate-100 text-[#003a88]">
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
        <Link href="/grades" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100">
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


