"use client"

import { Bell, BookOpen, Calendar, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, FileText, GraduationCap, Home, LogOut, Menu, Search, User, Users } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
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
}

type Class = {
  id: number
  title: string
  description: string
  instructor: string
  room: string
}

type Attendance = {
  id?: number
  student_id: number
  class_id: number
  date: string
  status: 'present' | 'absent' | 'authorized_leave' | 'medical' | 'unauthorized'
  notes: string
  name?: string
  rank?: string
}

export default function AttendanceManager() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([])
  const [loading, setLoading] = useState({
    students: true,
    classes: true,
    attendance: true,
  })
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    authorized_leave: 0,
    medical: 0,
    unauthorized: 0,
    total: 0,
  })

  // Fetch students and classes on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch students
        const studentsRes = await fetch('/api/students')
        if (!studentsRes.ok) throw new Error('Failed to fetch students')
        const studentsData = await studentsRes.json()
        setStudents(studentsData)
        setLoading(prev => ({ ...prev, students: false }))
        
        // Fetch classes
        const classesRes = await fetch('/api/classes')
        if (!classesRes.ok) throw new Error('Failed to fetch classes')
        const classesData = await classesRes.json()
        setClasses(classesData)
        
        // Set the first class as selected by default
        if (classesData.length > 0 && !selectedClass) {
          setSelectedClass(classesData[0].id.toString())
        }
        
        setLoading(prev => ({ ...prev, classes: false }))
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    
    fetchData()
  }, [])

  // Fetch attendance records when class or date changes
  useEffect(() => {
    if (!selectedClass) return
    
    const fetchAttendance = async () => {
      try {
        setLoading(prev => ({ ...prev, attendance: true }))
        
        const attendanceRes = await fetch(`/api/attendance?classId=${selectedClass}&date=${selectedDate}`)
        if (!attendanceRes.ok) throw new Error('Failed to fetch attendance')
        const attendanceData = await attendanceRes.json()
        
        // If we have attendance records, use them
        if (Array.isArray(attendanceData) && attendanceData.length > 0) {
          setAttendanceRecords(attendanceData)
        } else {
          // Otherwise, create empty records for all students
          const emptyRecords = students.map(student => ({
            student_id: student.id,
            class_id: parseInt(selectedClass),
            date: selectedDate,
            status: 'present' as const,
            notes: '',
            name: student.name,
            rank: student.rank,
          }))
          setAttendanceRecords(emptyRecords)
        }
        
        setLoading(prev => ({ ...prev, attendance: false }))
      } catch (error) {
        console.error('Error fetching attendance:', error)
        setLoading(prev => ({ ...prev, attendance: false }))
      }
    }
    
    fetchAttendance()
  }, [selectedClass, selectedDate, students])

  // Calculate attendance statistics
  useEffect(() => {
    const stats = {
      present: 0,
      absent: 0,
      authorized_leave: 0,
      medical: 0,
      unauthorized: 0,
      total: attendanceRecords.length,
    }
    
    attendanceRecords.forEach(record => {
      stats[record.status]++
    })
    
    setAttendanceStats(stats)
  }, [attendanceRecords])

  // Handle date navigation
  const goToPreviousDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - 1)
    setSelectedDate(date.toISOString().split('T')[0])
  }
  
  const goToNextDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + 1)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  // Handle attendance status change
  const handleStatusChange = (studentId: number, status: Attendance['status']) => {
    setAttendanceRecords(prev => 
      prev.map(record => 
        record.student_id === studentId 
          ? { ...record, status } 
          : record
      )
    )
  }

  // Handle notes change
  const handleNotesChange = (studentId: number, notes: string) => {
    setAttendanceRecords(prev => 
      prev.map(record => 
        record.student_id === studentId 
          ? { ...record, notes } 
          : record
      )
    )
  }

  // Save attendance records
  const saveAttendance = async () => {
    try {
      setSaving(true)
      
      // Save each attendance record
      for (const record of attendanceRecords) {
        await fetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: record.student_id,
            class_id: record.class_id,
            date: record.date,
            status: record.status,
            notes: record.notes,
          }),
        })
      }
      
      alert('Attendance saved successfully!')
    } catch (error) {
      console.error('Error saving attendance:', error)
      alert('Failed to save attendance. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Filter students by search query
  const filteredAttendance = searchQuery
    ? attendanceRecords.filter(record => 
        record.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.rank?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : attendanceRecords

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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
              <Home className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
              <Users className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium">Students</span>
            </div>
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
              <BookOpen className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium">Classes</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 text-[#003a88]">
              <ClipboardList className="h-5 w-5" />
              <span className="text-sm font-medium">Attendance</span>
            </div>
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
              <h1 className="text-2xl font-bold text-slate-900">Attendance Management</h1>
              <p className="text-slate-500">Record and manage student attendance</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
              <Card className="lg:col-span-3">
                <CardHeader>
                  <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
                    <CardTitle>Attendance Register</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={goToPreviousDay}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-40"
                      />
                      <Button variant="outline" size="sm" onClick={goToNextDay}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{formatDate(selectedDate)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
                      <div className="flex items-center space-x-2">
                        <label htmlFor="class-select" className="text-sm font-medium">
                          Class:
                        </label>
                        <Select
                          value={selectedClass}
                          onValueChange={setSelectedClass}
                          disabled={loading.classes}
                        >
                          <SelectTrigger id="class-select" className="w-[200px]">
                            <SelectValue placeholder="Select a class" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id.toString()}>
                                {cls.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex w-full items-center space-x-2 md:w-auto">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search students..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full md:w-[200px]"
                        />
                      </div>
                    </div>
                    
                    {loading.attendance ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[250px]">Student</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="hidden md:table-cell">Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAttendance.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                  No students found
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredAttendance.map((record) => (
                                <TableRow key={record.student_id}>
                                  <TableCell className="font-medium">
                                    {record.rank} {record.name}
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={record.status}
                                      onValueChange={(value) => 
                                        handleStatusChange(
                                          record.student_id, 
                                          value as Attendance['status']
                                        )
                                      }
                                    >
                                      <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="present">Present</SelectItem>
                                        <SelectItem value="absent">Absent</SelectItem>
                                        <SelectItem value="authorized_leave">Authorized Leave</SelectItem>
                                        <SelectItem value="medical">Medical</SelectItem>
                                        <SelectItem value="unauthorized">Unauthorized</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    <Input
                                      placeholder="Add notes..."
                                      value={record.notes || ''}
                                      onChange={(e) => handleNotesChange(record.student_id, e.target.value)}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={saveAttendance} 
                        disabled={saving || loading.attendance}
                      >
                        {saving ? 'Saving...' : 'Save Attendance'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Attendance Summary</CardTitle>
                  <CardDescription>
                    {selectedClass && classes.find(c => c.id.toString() === selectedClass)?.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {attendanceStats.present}
                        </div>
                        <div className="text-sm text-muted-foreground">Present</div>
                      </div>
                      <div className="rounded-lg border p-3 text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {attendanceStats.absent + attendanceStats.unauthorized}
                        </div>
                        <div className="text-sm text-muted-foreground">Absent</div>
                      </div>
                      <div className="rounded-lg border p-3 text-center">
                        <div className="text-2xl font-bold text-amber-600">
                          {attendanceStats.authorized_leave}
                        </div>
                        <div className="text-sm text-muted-foreground">Authorized Leave</div>
                      </div>
                      <div className="rounded-lg border p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {attendanceStats.medical}
                        </div>
                        <div className="text-sm text-muted-foreground">Medical</div>
                      </div>
                    </div>
                    
                    <div className="rounded-lg border p-4">
                      <h3 className="mb-2 font-medium">Attendance Rate</h3>
                      <div className="text-3xl font-bold">
                        {attendanceStats.total > 0
                          ? `${((attendanceStats.present / attendanceStats.total) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {attendanceStats.present} out of {attendanceStats.total} students present
                      </p>
                    </div>
                    
                    <Tabs defaultValue="daily">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="daily">Daily</TabsTrigger>
                        <TabsTrigger value="weekly">Weekly</TabsTrigger>
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                      </TabsList>
                      <TabsContent value="daily" className="space-y-4">
                        <div className="rounded-lg border p-4">
                          <h3 className="mb-2 font-medium">Today's Attendance</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Present</span>
                              <span className="text-sm font-medium">
                                {attendanceStats.present} ({attendanceStats.total > 0
                                  ? ((attendanceStats.present / attendanceStats.total) * 100).toFixed(0)
                                  : 0}%)
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Absent</span>
                              <span className="text-sm font-medium">
                                {attendanceStats.absent} ({attendanceStats.total > 0
                                  ? ((attendanceStats.absent / attendanceStats.total) * 100).toFixed(0)
                                  : 0}%)
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Authorized Leave</span>
                              <span className="text-sm font-medium">
                                {attendanceStats.authorized_leave} ({attendanceStats.total > 0
                                  ? ((attendanceStats.authorized_leave / attendanceStats.total) * 100).toFixed(0)
                                  : 0}%)
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Medical</span>
                              <span className="text-sm font-medium">
                                {attendanceStats.medical} ({attendanceStats.total > 0
                                  ? ((attendanceStats.medical / attendanceStats.total) * 100).toFixed(0)
                                  : 0}%)
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Unauthorized</span>
                              <span className="text-sm font-medium">
                                {attendanceStats.unauthorized} ({attendanceStats.total > 0
                                  ? ((attendanceStats.unauthorized / attendanceStats.total) * 100).toFixed(0)
                                  : 0}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="weekly">
                        <div className="py-8 text-center text-muted-foreground">
                          Weekly attendance data will be available soon
                        </div>
                      </TabsContent>
                      <TabsContent value="monthly">
                        <div className="py-8 text-center text-muted-foreground">
                          Monthly attendance data will be available soon
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
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
        <Link href="/" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100">
          <Home className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium">Dashboard</span>
        </Link>
        <Link href="#" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100">
          <Users className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium">Students</span>
        </Link>
        <Link href="#" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100">
          <BookOpen className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium">Classes</span>
        </Link>
        <Link href="/attendance" className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-[#003a88]">
          <ClipboardList className="h-5 w-5" />
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
