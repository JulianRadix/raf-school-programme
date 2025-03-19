"use client"

import { Bell, BookOpen, Calendar, ChevronDown, ClipboardList, FileText, GraduationCap, Home, LogOut, Menu, Plus, Search, Trash, User, Users } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Student = {
  id: number
  name: string
  rank: string
  squadron: string
  year: number
  email: string
  created_at: string
}

type StudentStats = {
  total: number
  squadrons: Array<{ squadron: string; count: number }>
  years: Array<{ year: number; count: number }>
  topAttendance: Array<{
    id: number
    name: string
    rate: number
    total_classes: number
    present_count: number
  }>
}

export default function StudentManager() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [loading, setLoading] = useState({
    students: true,
    stats: true,
  })
  const [error, setError] = useState({
    students: false,
    stats: false,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [squadronFilter, setSquadronFilter] = useState<string>("")
  const [yearFilter, setYearFilter] = useState<string>("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentDialogOpen, setStudentDialogOpen] = useState(false)
  const [newStudent, setNewStudent] = useState({
    name: "",
    rank: "",
    squadron: "",
    year: "",
    email: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Fetch students and stats on component mount
  useEffect(() => {
    fetchStudents()
    fetchStats()
  }, [])

  // Fetch students when filters change
  useEffect(() => {
    fetchStudents()
  }, [searchQuery, squadronFilter, yearFilter])

  const fetchStudents = async () => {
    try {
      setLoading((prev) => ({ ...prev, students: true }))
      
      let url = '/api/students'
      const params = new URLSearchParams()
      
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      
      if (squadronFilter) {
        params.append('squadron', squadronFilter)
      }
      
      if (yearFilter) {
        params.append('year', yearFilter)
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch students')
      
      const data = await res.json()
      setStudents(data)
      setError((prev) => ({ ...prev, students: false }))
    } catch (err) {
      console.error('Error fetching students:', err)
      setError((prev) => ({ ...prev, students: true }))
    } finally {
      setLoading((prev) => ({ ...prev, students: false }))
    }
  }

  const fetchStats = async () => {
    try {
      setLoading((prev) => ({ ...prev, stats: true }))
      
      const res = await fetch('/api/students/stats')
      if (!res.ok) throw new Error('Failed to fetch student statistics')
      
      const data = await res.json()
      setStats(data)
      setError((prev) => ({ ...prev, stats: false }))
    } catch (err) {
      console.error('Error fetching student statistics:', err)
      setError((prev) => ({ ...prev, stats: true }))
    } finally {
      setLoading((prev) => ({ ...prev, stats: false }))
    }
  }

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student)
    setStudentDialogOpen(true)
  }

  const handleAddNewStudent = () => {
    setIsEditing(false)
    setNewStudent({
      name: "",
      rank: "",
      squadron: "",
      year: "",
      email: "",
    })
    setStudentDialogOpen(true)
    setSelectedStudent(null)
  }

  const handleEditStudent = () => {
    if (!selectedStudent) return
    
    setIsEditing(true)
    setNewStudent({
      name: selectedStudent.name,
      rank: selectedStudent.rank || "",
      squadron: selectedStudent.squadron || "",
      year: selectedStudent.year ? selectedStudent.year.toString() : "",
      email: selectedStudent.email || "",
    })
  }

  const handleSaveStudent = async () => {
    try {
      setIsSaving(true)
      
      // Validate required fields
      if (!newStudent.name.trim()) {
        alert('Student name is required')
        return
      }
      
      const studentData = {
        name: newStudent.name.trim(),
        rank: newStudent.rank.trim() || null,
        squadron: newStudent.squadron.trim() || null,
        year: newStudent.year ? parseInt(newStudent.year, 10) : null,
        email: newStudent.email.trim() || null,
      }
      
      let res
      
      if (isEditing && selectedStudent) {
        // Update existing student
        res = await fetch(`/api/students/${selectedStudent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(studentData),
        })
      } else {
        // Create new student
        res = await fetch('/api/students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(studentData),
        })
      }
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save student')
      }
      
      // Refresh student list and stats
      await fetchStudents()
      await fetchStats()
      
      // Close dialog
      setStudentDialogOpen(false)
    } catch (err) {
      console.error('Error saving student:', err)
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to save student'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return
    
    try {
      setIsDeleting(true)
      
      const res = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to delete student')
      }
      
      // Refresh student list and stats
      await fetchStudents()
      await fetchStats()
      
      // Close dialogs
      setDeleteDialogOpen(false)
      setStudentDialogOpen(false)
    } catch (err) {
      console.error('Error deleting student:', err)
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to delete student'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
            <div className="flex items-center gap-2 px-2 py-1.5 text-[#003a88]">
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
                <h1 className="text-2xl font-bold text-slate-900">Student Management</h1>
                <p className="text-slate-500">View and manage students in the RAF School Programme</p>
              </div>
              <Button onClick={handleAddNewStudent} className="mt-2 md:mt-0">
                <Plus className="mr-2 h-4 w-4" /> Add New Student
              </Button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading.stats ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{stats?.total || 0}</div>
                  )}
                  <p className="text-xs text-muted-foreground">Enrolled in the programme</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Squadrons</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading.stats ? (
                    <Skeleton className="h-8 w-full" />
                  ) : (
                    <div className="space-y-2">
                      {stats?.squadrons?.slice(0, 3).map((item) => (
                        <div key={item.squadron} className="flex items-center justify-between">
                          <span className="text-sm">{item.squadron}</span>
                          <span className="text-sm font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Years</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading.stats ? (
                    <Skeleton className="h-8 w-full" />
                  ) : (
                    <div className="space-y-2">
                      {stats?.years?.map((item) => (
                        <div key={item.year} className="flex items-center justify-between">
                          <span className="text-sm">Year {item.year}</span>
                          <span className="text-sm font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
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
                          <span className="text-sm truncate max-w-[150px]">{item.name}</span>
                          <span className="text-sm font-medium">{item.rate}%</span>
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
                  <CardTitle>Students</CardTitle>
                  <CardDescription>Manage all students in the RAF School Programme</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
                      <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="squadron-filter" className="text-sm font-medium">
                            Squadron:
                          </Label>
                          <Select
                            value={squadronFilter}
                            onValueChange={setSquadronFilter}
                          >
                            <SelectTrigger id="squadron-filter" className="w-[150px]">
                              <SelectValue placeholder="All Squadrons" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Squadrons</SelectItem>
                              <SelectItem value="Alpha">Alpha</SelectItem>
                              <SelectItem value="Bravo">Bravo</SelectItem>
                              <SelectItem value="Charlie">Charlie</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="year-filter" className="text-sm font-medium">
                            Year:
                          </Label>
                          <Select
                            value={yearFilter}
                            onValueChange={setYearFilter}
                          >
                            <SelectTrigger id="year-filter" className="w-[150px]">
                              <SelectValue placeholder="All Years" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Years</SelectItem>
                              <SelectItem value="1">Year 1</SelectItem>
                              <SelectItem value="2">Year 2</SelectItem>
                              <SelectItem value="3">Year 3</SelectItem>
                              <SelectItem value="4">Year 4</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex w-full items-center space-x-2 md:w-auto">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search students..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full md:w-[250px]"
                        />
                      </div>
                    </div>
                    
                    {loading.students ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : error.students ? (
                      <div className="py-8 text-center text-muted-foreground">
                        Failed to load students. Please try again.
                      </div>
                    ) : students.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        No students found. Try adjusting your filters or add a new student.
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Rank</TableHead>
                              <TableHead>Squadron</TableHead>
                              <TableHead>Year</TableHead>
                              <TableHead className="hidden md:table-cell">Email</TableHead>
                              <TableHead className="hidden md:table-cell">Joined</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {students.map((student) => (
                              <TableRow 
                                key={student.id} 
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handleStudentSelect(student)}
                              >
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell>{student.rank || '-'}</TableCell>
                                <TableCell>{student.squadron || '-'}</TableCell>
                                <TableCell>{student.year || '-'}</TableCell>
                                <TableCell className="hidden md:table-cell">{student.email || '-'}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {student.created_at ? formatDate(student.created_at) : '-'}
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
            
            {/* Student Dialog */}
            <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    {selectedStudent ? (isEditing ? 'Edit Student' : 'Student Details') : 'Add New Student'}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedStudent 
                      ? (isEditing ? 'Update student information' : 'View student details') 
                      : 'Add a new student to the RAF School Programme'}
                  </DialogDescription>
                </DialogHeader>
                
                {selectedStudent && !isEditing ? (
                  <StudentDetails student={selectedStudent} onEdit={handleEditStudent} />
                ) : (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name*
                      </Label>
                      <Input
                        id="name"
                        value={newStudent.name}
                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                        className="col-span-3"
                        placeholder="e.g., Johnson, T."
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="rank" className="text-right">
                        Rank
                      </Label>
                      <Input
                        id="rank"
                        value={newStudent.rank}
                        onChange={(e) => setNewStudent({ ...newStudent, rank: e.target.value })}
                        className="col-span-3"
                        placeholder="e.g., Cadet"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="squadron" className="text-right">
                        Squadron
                      </Label>
                      <Select
                        value={newStudent.squadron}
                        onValueChange={(value) => setNewStudent({ ...newStudent, squadron: value })}
                      >
                        <SelectTrigger id="squadron" className="col-span-3">
                          <SelectValue placeholder="Select squadron" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Alpha">Alpha</SelectItem>
                          <SelectItem value="Bravo">Bravo</SelectItem>
                          <SelectItem value="Charlie">Charlie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="year" className="text-right">
                        Year
                      </Label>
                      <Select
                        value={newStudent.year}
                        onValueChange={(value) => setNewStudent({ ...newStudent, year: value })}
                      >
                        <SelectTrigger id="year" className="col-span-3">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Year 1</SelectItem>
                          <SelectItem value="2">Year 2</SelectItem>
                          <SelectItem value="3">Year 3</SelectItem>
                          <SelectItem value="4">Year 4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={newStudent.email}
                        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                        className="col-span-3"
                        placeholder="e.g., tjohnson@rafschool.example"
                      />
                    </div>
                  </div>
                )}
                
                <DialogFooter className="flex items-center justify-between">
                  {selectedStudent && !isEditing ? (
                    <Button 
                      variant="destructive" 
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash className="mr-2 h-4 w-4" /> Delete Student
                    </Button>
                  ) : (
                    <div></div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setStudentDialogOpen(false)}>
                      Cancel
                    </Button>
                    {selectedStudent && !isEditing ? (
                      <Button onClick={handleEditStudent}>
                        Edit
                      </Button>
                    ) : (
                      <Button onClick={handleSaveStudent} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save'}
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
                    Are you sure you want to delete this student? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteStudent} disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete'}
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

function StudentDetails({ student, onEdit }: { student: Student; onEdit: () => void }) {
  const [attendanceData, setAttendanceData] = useState<any>(null)
  const [gradesData, setGradesData] = useState<any>(null)
  const [loading, setLoading] = useState({
    attendance: true,
    grades: true,
  })
  const [error, setError] = useState({
    attendance: false,
    grades: false,
  })

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Fetch attendance data
        setLoading((prev) => ({ ...prev, attendance: true }))
        const attendanceRes = await fetch(`/api/students/${student.id}/attendance`)
        if (!attendanceRes.ok) throw new Error('Failed to fetch attendance data')
        const attendanceData = await attendanceRes.json()
        setAttendanceData(attendanceData)
        setError((prev) => ({ ...prev, attendance: false }))
      } catch (err) {
        console.error('Error fetching attendance data:', err)
        setError((prev) => ({ ...prev, attendance: true }))
      } finally {
        setLoading((prev) => ({ ...prev, attendance: false }))
      }
      
      try {
        // Fetch grades data
        setLoading((prev) => ({ ...prev, grades: true }))
        const gradesRes = await fetch(`/api/students/${student.id}/grades`)
        if (!gradesRes.ok) throw new Error('Failed to fetch grades data')
        const gradesData = await gradesRes.json()
        setGradesData(gradesData)
        setError((prev) => ({ ...prev, grades: false }))
      } catch (err) {
        console.error('Error fetching grades data:', err)
        setError((prev) => ({ ...prev, grades: true }))
      } finally {
        setLoading((prev) => ({ ...prev, grades: false }))
      }
    }
    
    fetchStudentData()
  }, [student.id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col space-y-4 md:flex-row md:space-x-6 md:space-y-0">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
          <User className="h-12 w-12 text-slate-600" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold">{student.name}</h3>
          <p className="text-sm text-muted-foreground">{student.rank || 'No rank'}</p>
          <div className="flex flex-wrap gap-2">
            {student.squadron && (
              <div className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                {student.squadron} Squadron
              </div>
            )}
            {student.year && (
              <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                Year {student.year}
              </div>
            )}
          </div>
          <p className="text-sm">{student.email || 'No email'}</p>
        </div>
      </div>
      
      <Separator />
      
      <Tabs defaultValue="attendance">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
        </TabsList>
        
        <TabsContent value="attendance" className="space-y-4">
          {loading.attendance ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : error.attendance ? (
            <div className="py-4 text-center text-muted-foreground">
              Failed to load attendance data
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {attendanceData?.stats?.attendanceRate || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">Attendance Rate</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {attendanceData?.stats?.total_classes || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Total Classes</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {attendanceData?.stats?.present_count || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Present</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {attendanceData?.stats?.absent_count || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Absent</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <h4 className="text-sm font-medium">Recent Attendance Records</h4>
              
              {attendanceData?.records?.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground">
                  No attendance records found
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceData?.records?.map((record: any) => (
                        <TableRow key={record.id}>
                          <TableCell>{formatDate(record.date)}</TableCell>
                          <TableCell>{record.class_title}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                                record.status === 'present'
                                  ? 'bg-green-100 text-green-800'
                                  : record.status === 'unauthorized'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {formatStatus(record.status)}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {record.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="grades" className="space-y-4">
          {loading.grades ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : error.grades ? (
            <div className="py-4 text-center text-muted-foreground">
              Failed to load grades data
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {gradesData?.stats?.average_percentage || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">Average Grade</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {gradesData?.stats?.total_assignments || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Total Assignments</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <h4 className="text-sm font-medium">Recent Grades</h4>
              
              {gradesData?.grades?.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground">
                  No grades found
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead className="hidden md:table-cell">Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gradesData?.grades?.map((grade: any) => (
                        <TableRow key={grade.id}>
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
                          <TableCell className="hidden md:table-cell">
                            {formatDate(grade.submitted_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
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
        <Link href="/students" className="flex items-center gap-2 rounded-md px-3 py-2 bg-slate-100 text-[#003a88]">
          <Users className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium">Students</span>
        </Link>
        <Link href="/classes" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100">
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
