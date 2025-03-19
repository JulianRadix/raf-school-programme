"use client"

import {
  Bell,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
}

type Class = {
  id: number
  title: string
  description: string
  instructor: string
  room: string
}

type WeekSchedule = {
  day: number
  dayName: string
  classes: ClassSchedule[]
}

export default function ScheduleManager() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [schedule, setSchedule] = useState<ClassSchedule[]>([])
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState({
    schedule: true,
    classes: true,
  })
  const [error, setError] = useState({
    schedule: false,
    classes: false,
  })
  const [viewMode, setViewMode] = useState<"day" | "week">("week")
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 7) // Default to current day (1-7)
  const [selectedSchedule, setSelectedSchedule] = useState<ClassSchedule | null>(null)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    class_id: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Fetch data on component mount
  useEffect(() => {
    fetchClasses()
    fetchSchedule()
  }, [])

  // Fetch schedule when view mode or selected day changes
  useEffect(() => {
    fetchSchedule()
  }, [viewMode, selectedDay])

  const fetchSchedule = async () => {
    try {
      setLoading((prev) => ({ ...prev, schedule: true }))

      let url = "/api/class-schedule"
      const params = new URLSearchParams()

      if (viewMode === "day") {
        params.append("day", selectedDay.toString())
      } else {
        params.append("weekView", "true")
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch schedule")

      const data = await res.json()

      if (viewMode === "week") {
        setWeekSchedule(data)
      } else {
        setSchedule(data)
      }

      setError((prev) => ({ ...prev, schedule: false }))
    } catch (err) {
      console.error("Error fetching schedule:", err)
      setError((prev) => ({ ...prev, schedule: true }))
    } finally {
      setLoading((prev) => ({ ...prev, schedule: false }))
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

  const handleScheduleSelect = async (schedule: ClassSchedule) => {
    try {
      const res = await fetch(`/api/class-schedule/${schedule.id}`)
      if (!res.ok) throw new Error("Failed to fetch schedule details")

      const data = await res.json()
      setSelectedSchedule(data)
      setScheduleDialogOpen(true)
    } catch (err) {
      console.error("Error fetching schedule details:", err)
      alert("Failed to load schedule details. Please try again.")
    }
  }

  const handleAddNewSchedule = () => {
    setIsEditing(false)
    setNewSchedule({
      class_id: "",
      day_of_week: viewMode === "day" ? selectedDay.toString() : "1",
      start_time: "",
      end_time: "",
    })
    setScheduleDialogOpen(true)
    setSelectedSchedule(null)
  }

  const handleEditSchedule = () => {
    if (!selectedSchedule) return

    setIsEditing(true)
    setNewSchedule({
      class_id: selectedSchedule.class_id.toString(),
      day_of_week: selectedSchedule.day_of_week.toString(),
      start_time: selectedSchedule.start_time,
      end_time: selectedSchedule.end_time,
    })
  }

  const handleSaveSchedule = async () => {
    try {
      setIsSaving(true)

      // Validate required fields
      if (!newSchedule.class_id || !newSchedule.day_of_week || !newSchedule.start_time || !newSchedule.end_time) {
        alert("All fields are required")
        return
      }

      const scheduleData = {
        class_id: Number.parseInt(newSchedule.class_id),
        day_of_week: Number.parseInt(newSchedule.day_of_week),
        start_time: newSchedule.start_time,
        end_time: newSchedule.end_time,
      }

      let res

      if (isEditing && selectedSchedule) {
        // Update existing schedule
        res = await fetch(`/api/class-schedule/${selectedSchedule.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(scheduleData),
        })
      } else {
        // Create new schedule
        res = await fetch("/api/class-schedule", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(scheduleData),
        })
      }

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to save schedule")
      }

      // Refresh schedule
      await fetchSchedule()

      // Close dialog
      setScheduleDialogOpen(false)
    } catch (err) {
      console.error("Error saving schedule:", err)
      alert(`Error: ${err instanceof Error ? err.message : "Failed to save schedule"}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return

    try {
      setIsDeleting(true)

      const res = await fetch(`/api/class-schedule/${selectedSchedule.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to delete schedule")
      }

      // Refresh schedule
      await fetchSchedule()

      // Close dialogs
      setDeleteDialogOpen(false)
      setScheduleDialogOpen(false)
    } catch (err) {
      console.error("Error deleting schedule:", err)
      alert(`Error: ${err instanceof Error ? err.message : "Failed to delete schedule"}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const getDayName = (day: number): string => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    return days[day - 1] // Adjust for 1-based index
  }

  const formatTime = (timeString: string): string => {
    return timeString.substring(0, 5) // Format HH:MM
  }

  const handlePreviousDay = () => {
    setSelectedDay((prev) => (prev === 1 ? 7 : prev - 1))
  }

  const handleNextDay = () => {
    setSelectedDay((prev) => (prev === 7 ? 1 : prev + 1))
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
              <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
                <GraduationCap className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-medium">Grades</span>
              </div>
            </Link>
            <Link href="/schedule" className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
              <div className="flex items-center gap-2 px-2 py-1.5 text-[#003a88]">
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
                <h1 className="text-2xl font-bold text-slate-900">Class Schedule</h1>
                <p className="text-slate-500">View and manage the class schedule for RAF School Programme</p>
              </div>
              <div className="flex items-center gap-2">
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "day" | "week")} className="mr-2">
                  <TabsList>
                    <TabsTrigger value="day">Day View</TabsTrigger>
                    <TabsTrigger value="week">Week View</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button onClick={handleAddNewSchedule}>
                  <Plus className="mr-2 h-4 w-4" /> Add Class
                </Button>
              </div>
            </div>

            {viewMode === "day" && (
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePreviousDay}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle>{getDayName(selectedDay)}</CardTitle>
                    <Button variant="outline" size="icon" onClick={handleNextDay}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading.schedule ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : error.schedule ? (
                    <div className="py-8 text-center text-muted-foreground">
                      Failed to load schedule. Please try again.
                    </div>
                  ) : schedule.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      No classes scheduled for {getDayName(selectedDay)}.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {schedule.map((cls) => (
                        <div
                          key={cls.id}
                          className="flex items-center gap-4 rounded-lg border p-4 cursor-pointer hover:bg-muted/50"
                          onClick={() => handleScheduleSelect(cls)}
                        >
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-[#003a88] text-white">
                            <Calendar className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">{cls.title}</h3>
                              <span className="text-sm text-muted-foreground">
                                {formatTime(cls.start_time)} - {formatTime(cls.end_time)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground">
                                {cls.instructor ? `Instructor: ${cls.instructor}` : ""}
                              </p>
                              <p className="text-sm text-muted-foreground">{cls.room ? `Room: ${cls.room}` : ""}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {viewMode === "week" && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {loading.schedule ? (
                  Array.from({ length: 7 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <Skeleton className="h-6 w-24" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Array.from({ length: 3 }).map((_, j) => (
                            <Skeleton key={j} className="h-12 w-full" />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : error.schedule ? (
                  <div className="col-span-full py-8 text-center text-muted-foreground">
                    Failed to load schedule. Please try again.
                  </div>
                ) : (
                  weekSchedule.map((day) => (
                    <Card key={day.day} className={day.day === selectedDay ? "border-primary" : ""}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{day.dayName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {day.classes.length === 0 ? (
                          <div className="py-4 text-center text-muted-foreground text-sm">No classes scheduled</div>
                        ) : (
                          <div className="space-y-2">
                            {day.classes.map((cls) => (
                              <div
                                key={cls.id}
                                className="rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
                                onClick={() => handleScheduleSelect(cls)}
                              >
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium text-sm">{cls.title}</h3>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <p className="text-xs text-muted-foreground">{cls.room || ""}</p>
                                  <p className="text-xs font-medium">
                                    {cls.time || `${formatTime(cls.start_time)} - ${formatTime(cls.end_time)}`}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Schedule Dialog */}
            <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {selectedSchedule ? (isEditing ? "Edit Schedule" : "Schedule Details") : "Add New Schedule"}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedSchedule
                      ? isEditing
                        ? "Update schedule information"
                        : "View schedule details"
                      : "Add a new class to the schedule"}
                  </DialogDescription>
                </DialogHeader>

                {selectedSchedule && !isEditing ? (
                  <div className="space-y-4 py-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium">{selectedSchedule.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {getDayName(selectedSchedule.day_of_week)}, {formatTime(selectedSchedule.start_time)} -{" "}
                        {formatTime(selectedSchedule.end_time)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Instructor</Label>
                        <p className="text-sm">{selectedSchedule.instructor || "Not specified"}</p>
                      </div>
                      <div>
                        <Label className="text-sm">Room</Label>
                        <p className="text-sm">{selectedSchedule.room || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="class" className="text-right">
                        Class*
                      </Label>
                      <Select
                        value={newSchedule.class_id}
                        onValueChange={(value) => setNewSchedule({ ...newSchedule, class_id: value })}
                        disabled={isEditing}
                      >
                        <SelectTrigger id="class" className="col-span-3">
                          <SelectValue placeholder="Select class" />
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
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="day" className="text-right">
                        Day*
                      </Label>
                      <Select
                        value={newSchedule.day_of_week}
                        onValueChange={(value) => setNewSchedule({ ...newSchedule, day_of_week: value })}
                      >
                        <SelectTrigger id="day" className="col-span-3">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                          <SelectItem value="7">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="start-time" className="text-right">
                        Start Time*
                      </Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={newSchedule.start_time}
                        onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="end-time" className="text-right">
                        End Time*
                      </Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={newSchedule.end_time}
                        onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                  </div>
                )}

                <DialogFooter className="flex items-center justify-between">
                  {selectedSchedule && !isEditing ? (
                    <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                      <Trash className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  ) : (
                    <div></div>
                  )}

                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                      Cancel
                    </Button>
                    {selectedSchedule && !isEditing ? (
                      <Button onClick={handleEditSchedule}>Edit</Button>
                    ) : (
                      <Button onClick={handleSaveSchedule} disabled={isSaving}>
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
                    Are you sure you want to delete this schedule entry? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteSchedule} disabled={isDeleting}>
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
        <Link href="/grades" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100">
          <FileText className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium">Grades</span>
        </Link>
        <Link href="/schedule" className="flex items-center gap-2 rounded-md px-3 py-2 bg-slate-100 text-[#003a88]">
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

