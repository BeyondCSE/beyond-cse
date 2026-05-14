"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { deleteDoc } from "firebase/firestore";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { query, where, onSnapshot } from "firebase/firestore";
import { updateDoc } from "firebase/firestore";
import { orderBy } from "firebase/firestore";
import { PieChart, Pie, Cell, Tooltip } from "recharts";


export default function Dashboard() {
const [user, setUser] = useState<User | null>(null);
const [activeTab, setActiveTab] = useState("home");
const [sidebarOpen, setSidebarOpen] = useState(false); // mobile
const [desktopSidebar, setDesktopSidebar] = useState(true); // desktop
const [username, setUsername] = useState<string | null>(null);
const [userPhoto, setUserPhoto] = useState<string | null>(null);
const [isEditingName, setIsEditingName] = useState(false);
const [isEditingBio, setIsEditingBio] = useState(false);

const [newUsername, setNewUsername] = useState("");
const [bio, setBio] = useState("");
const [newBio, setNewBio] = useState("");
const [usernameError, setUsernameError] = useState("");
const router = useRouter();
const [tasks, setTasks] = useState<any[]>([]);
const [todoTab, setTodoTab] = useState("daily");
const [taskInput, setTaskInput] = useState("");
const [streak, setStreak] = useState(0);
const [lastCompletedDate, setLastCompletedDate] = useState("");

useEffect(() => {
const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
if (!currentUser) {
  router.push("/?auth=signup");
} else {
setUser(currentUser);


    const userRef = doc(db, "users", currentUser.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
  const data = snap.data();

  setUsername(data.username);
  setBio(data.bio || "");

  setStreak(data.currentStreak || 0);

  // 🔥 ADD THIS LINE HERE
  setLastCompletedDate(data.lastCompletedDate || "");
}
  }
});

return () => unsubscribe();


}, [router]);
useEffect(() => {
  if (!user) return;

  const q = query(
  collection(db, "todos"),
  where("uid", "==", user.uid),
  orderBy("createdAt", "desc")
);

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const list: any[] = [];

    snapshot.forEach((doc) => {
      list.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    setTasks(list);
  });

  return () => unsubscribe();
}, [user]);
useEffect(() => {
  if (!user || tasks.length === 0) return;

  cleanupDailyTasks();
}, [user, tasks]);

const handleLogout = async () => {
await signOut(auth);
router.push("/");
};

const handleExit = () => {
router.push("/");
};
const handleSaveProfile = async () => {
  if (!user) return;

  try {
    console.log("SAVE CLICKED");

    const cleanNew = newUsername.trim();
    const cleanOld = username?.trim();

    let finalUsername = username;
    let finalUsernameKey = null;

    // 🔥 HANDLE USERNAME CHANGE
    if (cleanNew && cleanNew !== cleanOld) {
      const cleanKey = cleanNew.toLowerCase().replace(/\s+/g, "");

      const usernameRef = doc(db, "usernames", cleanKey);
      const existing = await getDoc(usernameRef);

      if (existing.exists() && existing.data().uid !== user.uid) {
        setUsernameError("Username already taken ❌");
        return;
      }

      // delete old username key
      if (cleanOld) {
        const oldKey = cleanOld.toLowerCase().replace(/\s+/g, "");
        await deleteDoc(doc(db, "usernames", oldKey));
      }

      // save new username key
      await setDoc(usernameRef, { uid: user.uid });

      finalUsername = cleanNew;
      finalUsernameKey = cleanKey;
    }

    // 🔥 HANDLE BIO
    const finalBio = isEditingBio ? newBio : bio;

    // 🔥 SAVE TO FIRESTORE (ALWAYS RUNS)
    await setDoc(
      doc(db, "users", user.uid),
      {
        username: finalUsername,
        usernameKey: finalUsernameKey,
        bio: finalBio,
      },
      { merge: true }
    );

    console.log("SAVED SUCCESSFULLY");

    // 🔥 UPDATE UI
    setUsername(finalUsername);
    setBio(finalBio);

    setIsEditingName(false);
    setIsEditingBio(false);
    setNewUsername("");
    setNewBio("");
    setUsernameError("");

  } catch (err) {
    console.error("SAVE ERROR:", err);
  }
};
const addTask = async () => {
  if (!taskInput.trim() || !user) return;

  const newTask = {
  text: taskInput,
  completed: false,
  uid: user.uid,
  type: "daily",
  createdAt: serverTimestamp(),
};
  

  await addDoc(collection(db, "todos"), newTask);

  setTaskInput("");
};
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};
const toggleTask = async (id: string, completed: boolean) => {
  if (!user) return;

  await updateDoc(doc(db, "todos", id), {
    completed: !completed,
  });

  // 🔥 ADD THIS PART
  if (!completed) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return;

  const data = snap.data();

  const currentStreak = data.currentStreak ?? 0;
  const lastDate = data.lastCompletedDate ?? "";

  const todayStr = formatDate(new Date());

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = formatDate(yesterday);

  let newStreak = currentStreak;

  if (lastDate === todayStr) {
    // ✅ Already counted today → DO NOTHING BUT KEEP UI SAFE
    return;
  }

  if (lastDate === yesterdayStr) {
    newStreak = currentStreak + 1;
  } else {
    newStreak = 1;
  }

  await updateDoc(userRef, {
    currentStreak: newStreak,
    lastCompletedDate: todayStr,
  });

  // ✅ ALWAYS update UI AFTER FIRESTORE
  setStreak(newStreak);
  setLastCompletedDate(todayStr);
}
};

const deleteTask = async (id: string) => {
  await deleteDoc(doc(db, "todos", id));
};
const cleanupDailyTasks = async () => {
  if (!user) return;

  try {
    const today = new Date().toLocaleDateString("en-CA");

    const userRef = doc(db, "users", user.uid);

    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const lastCleanup =
      userSnap.data().lastTodoCleanup || "";

    // already cleaned today
    if (lastCleanup === today) return;

    // 🔥 get only daily tasks
    const dailyTasks = tasks.filter(
      (task) => task.type === "daily"
    );

    for (const task of dailyTasks) {

      // ✅ completed task → delete
      if (task.completed) {

        await deleteDoc(doc(db, "todos", task.id));

      }

      // ❌ incomplete task → move
      else {

        await updateDoc(doc(db, "todos", task.id), {
          type: "incomplete",
        });

      }
    }

    // save cleanup date
    await updateDoc(userRef, {
      lastTodoCleanup: today,
    });

  } catch (err) {
    console.error(err);
  }
};
const dailyTasks = tasks.filter(
  (task) => task.type === "daily"
);

const incompleteTasks = tasks.filter(
  (task) => task.type === "incomplete"
);
const totalTasks = tasks.length;
const completedTasks = tasks.filter(t => t.completed).length;
const percentage = totalTasks === 0
  ? 0
  : Math.round((completedTasks / totalTasks) * 100);
const data = [
  { name: "Completed", value: completedTasks },
  { name: "Remaining", value: totalTasks - completedTasks },
];
const getStreakMessage = () => {
  if (!streak) return "Start your journey today 🚀";
  if (streak <= 3) return "Good start, keep going 💪";
  if (streak <= 7) return "You're building momentum 🔥";
  return "You're unstoppable 😈";
};

const streakMessage = getStreakMessage();

const getStreakWarning = () => {
  if (!user) return "";

  const today = new Date();
  const todayStr = new Date().toLocaleDateString("en-CA");

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (!lastCompletedDate) return "Start your streak today 🚀";

  if (lastCompletedDate === todayStr) return "";

  if (lastCompletedDate === yesterdayStr) {
    return "⚠️ Complete a task today to keep your streak alive!";
  }

  return "";
};

const warning = getStreakWarning();
const getStreakMilestone = () => {
  if (!streak) return "Start building your streak today 🚀";

  if (streak < 3) {
    const remaining = 3 - streak;
    return `Just ${remaining} more day${remaining > 1 ? "s" : ""} to reach a 3 day streak 💪`;
  }

  if (streak === 3) {
    return "🎉 Nice! You hit a 3 day streak!";
  }

  if (streak < 7) {
    const remaining = 7 - streak;
    return `Only ${remaining} more day${remaining > 1 ? "s" : ""} to reach a 7 day streak 🔥`;
  }

  if (streak === 7) {
    return "🔥 7 day streak! You're on fire!";
  }

  if (streak < 30) {
    const remaining = 30 - streak;
    return `${remaining} more day${remaining > 1 ? "s" : ""} to reach a 30 day elite streak 😈`;
  }

  if (streak === 30) {
    return "😈 30 day streak! Elite level unlocked!";
  }

  return "Keep pushing forward 🚀";
};

const milestone = getStreakMilestone();

return ( <div className="flex flex-col md:flex-row min-h-screen bg-[#0a0a0a] text-white">


  {/* DESKTOP SIDEBAR */}
{desktopSidebar && (
  <>

    {/* Overlay */}
    {sidebarOpen && (
      <div
        onClick={() => setSidebarOpen(false)}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />
    )}

    {/* Sidebar */}
    <div
      className={`fixed top-0 left-0 h-full w-64 bg-[#0a0a0a] border-r border-[#00f0ff]/20 z-50
      transform transition-transform duration-300 ease-in-out
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
    >

      {/* CONTENT INSIDE SIDEBAR */}
      <div className="flex flex-col h-full p-6">

        <h1 className="text-xl text-[#00f0ff] font-semibold mb-6">
          Beyond CSE
        </h1>

        <nav className="flex flex-col gap-4 text-sm">

          <span
            onClick={() => setActiveTab("home")}
            className="cursor-pointer hover:text-[#00f0ff] active:scale-95 transition duration-150"
          >
            Dashboard
          </span>

          <span
            onClick={() => setActiveTab("courses")}
            className="cursor-pointer hover:text-[#00f0ff] active:scale-95 transition duration-150"
          >
            Courses
          </span>

          <span
            onClick={() => setActiveTab("profile")}
            className="cursor-pointer hover:text-[#00f0ff] active:scale-95 transition duration-150"
          >
            Profile
          </span>
          <span
  onClick={() => {
    setActiveTab("progress");
    setSidebarOpen(false);
  }}
  className={`cursor-pointer transition duration-150 ${
    activeTab === "progress"
      ? "text-[#00f0ff] font-semibold"
      : "hover:text-[#00f0ff]"
  }`}
>
  My Progress
</span>
          <span
  onClick={() => {
    setActiveTab("todo");
    setSidebarOpen(false);
  }}
  className={`cursor-pointer transition duration-150 ${
    activeTab === "todo"
      ? "text-[#00f0ff] font-semibold"
      : "hover:text-[#00f0ff]"
  }`}
>
  Todo
</span>
<span
  onClick={() => {
    setActiveTab("streak");
    setSidebarOpen(false);
  }}
  className={`cursor-pointer transition duration-150 ${
    activeTab === "streak"
      ? "text-[#00f0ff] font-semibold"
      : "hover:text-[#00f0ff]"
  }`}
>
  My Streak
</span>

        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto px-4 py-2 border border-red-400 text-red-400 rounded-lg"
        >
          Logout
        </button>

      </div>
    </div>
  </>
)}

  {/* MAIN */}
  <div className="flex-1 p-4 md:p-10 pb-20 md:pb-0 flex flex-col items-center md:items-start">
    <div className="w-full max-w-md md:max-w-none">

      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex justify-between items-center mb-4">

        <div className="flex items-center gap-3">
          {/* HAMBURGER */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-xl text-[#00f0ff]"
          >
            ☰
          </button>

          <h1 className="text-lg text-[#00f0ff] font-semibold">
            Beyond CSE
          </h1>
        </div>

        {/* EXIT BUTTON RESTORED */}
        <button
          onClick={handleExit}
          className="px-3 py-1 text-xs border border-yellow-400 text-yellow-400 rounded-md"
        >
          Exit
        </button>

      </div>

      {/* 🔥 MOBILE SIDEBAR */}
      {sidebarOpen && (
        <div className="md:hidden fixed top-0 left-0 w-[70%] h-full bg-[#0a0a0a] border-r border-[#00f0ff]/20 p-5 z-50 flex flex-col gap-6">

          <button
            onClick={() => setSidebarOpen(false)}
            className="text-right"
          >
            ✖
          </button>

          <h1 className="text-xl text-[#00f0ff]">
            Beyond CSE
          </h1>



<span
  onClick={() => {
    setActiveTab("home");
    setSidebarOpen(false); // 🔥 CLOSE SIDEBAR
  }}
  className="cursor-pointer hover:text-[#00f0ff] active:scale-95 transition"
>
  Dashboard
</span>

<span
  onClick={() => {
    setActiveTab("courses");
    setSidebarOpen(false);
  }}
  className="cursor-pointer hover:text-[#00f0ff] active:scale-95 transition"
>
  Courses
</span>

<span
  onClick={() => {
    setActiveTab("profile");
    setSidebarOpen(false);
  }}
  className="cursor-pointer hover:text-[#00f0ff] active:scale-95 transition"
>
  Profile
</span>
<span
  onClick={() => {
    setActiveTab("todo");
    setSidebarOpen(false);
  }}
  className="cursor-pointer hover:text-[#00f0ff] active:scale-95 transition"
>
  Todo
</span>

<span
  onClick={() => {
    setActiveTab("progress");
    setSidebarOpen(false);
  }}
  className="cursor-pointer hover:text-[#00f0ff] active:scale-95 transition"
>
  My Progress
</span>

<span
  onClick={() => {
    setActiveTab("streak");
    setSidebarOpen(false);
  }}
  className="cursor-pointer hover:text-[#00f0ff] active:scale-95 transition"
>
  My Streak
</span>

          <button
            onClick={handleLogout}
            className="mt-auto border border-red-400 text-red-400 rounded-lg py-2"
          >
            Logout
          </button>

        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">

        <div className="flex items-center gap-3">
          {/* DESKTOP HAMBURGER */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:block text-xl text-[#00f0ff]"
          >
            ☰
          </button>

          <h2 className="text-3xl text-[#00f0ff]">
            Welcome, {username || user?.email || "User"}
          </h2>
        </div>

        <button
          onClick={handleExit}
          className="hidden md:block px-4 py-2 border border-yellow-400 text-yellow-400 rounded-lg"
        >
          Exit Dashboard
        </button>

      </div>

      {/* CONTENT */}
      {activeTab === "home" && (
        <>
          <p className="text-gray-400 mb-6">
            Your journey to go Beyond begins here 🚀
          </p>
          <h3 className="text-xl md:text-2xl text-[#00f0ff] mb-4">
  Quick Picks
</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div
  onClick={() => setActiveTab("courses")}
  className="p-5 border border-cyan-400/20 rounded-xl cursor-pointer hover:shadow-md active:scale-95 transition duration-150"
>
  Courses
</div>

<div
  onClick={() => setActiveTab("profile")}
  className="p-5 border border-cyan-400/20 rounded-xl cursor-pointer hover:shadow-md active:scale-95 transition duration-150"
>
  Profile
</div>
<div
  onClick={() => setActiveTab("todo")}
  className="p-5 border border-cyan-400/20 rounded-xl cursor-pointer 
  hover:shadow-md active:scale-95 transition duration-150"
>
  Todo
</div>

          </div>
        </>
      )}

      {activeTab === "courses" && (
  <div className="w-[90%] sm:w-[80%] max-w-4xl mx-auto rounded-2xl p-8
    bg-gradient-to-br from-[#0a0a0a]/80 to-[#0a0a0a]/40
    border border-[#00f0ff]/20 backdrop-blur-xl
    shadow-[0_0_40px_rgba(0,240,255,0.15)]">

    <h2 className="text-3xl text-[#00f0ff] mb-6">
      Your Courses
    </h2>

    <div className="flex flex-col items-center justify-center text-center py-16">

      <p className="text-gray-400 text-lg mb-3">
        You are not enrolled in any course
      </p>

      <p className="text-gray-500 text-sm max-w-md">
        Once you enroll in a course, it will appear here. Start exploring and begin your learning journey 🚀
      </p>

    </div>
  </div>
)}
{activeTab === "todo" && (
  <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 md:px-0">
  <div className="flex justify-center md:block">

    
    <div className="w-full max-w-md mx-auto md:max-w-none
rounded-3xl p-4 md:p-8
bg-gradient-to-br from-[#0a0a0a]/90 to-[#0f0f0f]/70
border border-[#00f0ff]/20
backdrop-blur-2xl
shadow-[0_0_40px_rgba(0,240,255,0.12)]
hover:shadow-[0_0_70px_rgba(0,240,255,0.2)]
transition-all duration-500">

  {/* ✅ MOVED HERE */}
  <h2 className="text-2xl md:text-3xl text-[#00f0ff] mb-5 md:mb-6 text-center md:text-left">
    Your Tasks
  </h2>

    {/* INPUT */}
    <div className="flex gap-2 mb-5 items-center w-full">
      <input
  type="text"
  value={taskInput}
  onChange={(e) => setTaskInput(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      addTask();
    }
  }}
  placeholder="What do you want to do today?"
  className="flex-1 min-w-0 bg-black border border-[#00f0ff]/20 rounded px-3 py-2 focus:outline-none"
/>
      <button
  onClick={addTask}
  className="px-3 py-2 whitespace-nowrap border border-[#00f0ff] text-[#00f0ff] rounded hover:bg-[#00f0ff]/10"
>
  Add
</button>
    </div>


    {/* 🔥 DYNAMIC ISLAND TAB SWITCHER */}
<div className="flex justify-center mb-6">

  <div className="relative flex items-center bg-[#0f0f0f]/80
  border border-[#00f0ff]/20 rounded-full p-1
  backdrop-blur-xl shadow-[0_0_25px_rgba(0,240,255,0.12)]">

    {/* ACTIVE TAB GLOW */}
    <div
      className={`absolute top-1 bottom-1 w-[48%] rounded-full
      bg-[#00f0ff]/10 border border-[#00f0ff]/30
      shadow-[0_0_20px_rgba(0,240,255,0.4)]
      transition-all duration-300
      ${todoTab === "daily"
        ? "left-1"
        : "left-1/2"}`}
    />

    {/* DAILY TAB */}
    <button
      onClick={() => setTodoTab("daily")}
      className={`relative z-10 px-4 py-2 md:px-8 md:py-3
      rounded-full text-sm md:text-base transition-all duration-300
      ${todoTab === "daily"
        ? "text-[#00f0ff]"
        : "text-gray-400 hover:text-white"}`}
    >
      Daily Todo ({dailyTasks.length})
    </button>

    {/* INCOMPLETE TAB */}
    <button
      onClick={() => setTodoTab("incomplete")}
      className={`relative z-10 px-4 py-2 md:px-8 md:py-3
      rounded-full text-sm md:text-base transition-all duration-300
      ${todoTab === "incomplete"
        ? "text-[#00f0ff]"
        : "text-gray-400 hover:text-white"}`}
    >
      Incomplete ({incompleteTasks.length})
    </button>

  </div>
</div>


{/* 🔥 TASK DISPLAY */}
{(todoTab === "daily"
  ? dailyTasks
  : incompleteTasks
).length === 0 ? (

  <div className="text-center text-gray-500 mt-10">
    {todoTab === "daily"
      ? "No daily tasks yet 🚀"
      : "No incomplete tasks 🎉"}
  </div>

) : (

  <div className="space-y-3">

    {(todoTab === "daily"
      ? dailyTasks
      : incompleteTasks
    ).map((task) => (

      <div
        key={task.id}
        className="group flex items-center justify-between
        bg-[#111]/80 p-3 md:p-4 rounded-2xl
        border border-[#00f0ff]/10
        hover:border-[#00f0ff]/40
        hover:shadow-[0_0_25px_rgba(0,240,255,0.15)]
        transition-all duration-300"
      >

        {/* TASK TEXT */}
        <span
          className={`transition text-sm md:text-base ${
            task.completed
              ? "line-through text-gray-500 opacity-60"
              : "text-gray-200"
          }`}
        >
          {task.text}
        </span>

        {/* ACTIONS */}
        <div className="flex items-center gap-3">

          {/* COMPLETE */}
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => toggleTask(task.id, task.completed)}
            className="w-4 h-4 accent-[#00f0ff]
            cursor-pointer scale-110"
          />

          {/* DELETE */}
          <button
            onClick={() => deleteTask(task.id)}
            className="text-red-400 text-sm
            hover:text-red-300 transition"
          >
            ✖
          </button>

        </div>

      </div>
    ))}

  </div>
)}

  </div>
  </div>
  </div>
)}
{activeTab === "progress" && (
  <div className="w-full max-w-3xl mx-auto">

    {/* 🔥 CARD BOX */}
    <div className="rounded-2xl p-8
  bg-gradient-to-br from-[#0a0a0a]/80 to-[#0a0a0a]/40
  border border-[#00f0ff]/20 backdrop-blur-xl
  shadow-[0_0_40px_rgba(0,240,255,0.15)]
  hover:shadow-[0_0_60px_rgba(0,240,255,0.25)]
  transition-all duration-500">

      <h2 className="text-3xl text-[#00f0ff] mb-6 text-center">
        My Progress
      </h2>

      {/* PIE CHART */}
      <div className="flex flex-col items-center mt-6">

        <PieChart width={240} height={240}>
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <Pie
    data={data}
    cx="50%"
    cy="50%"
    innerRadius={70}
    outerRadius={100}
    paddingAngle={4}
    dataKey="value"
    isAnimationActive={true}
    animationDuration={800}
    animationEasing="ease-out"
  >
    <Cell fill="#00f0ff" filter="url(#glow)" />
    <Cell fill="#1f2937" />
  </Pie>

  <Tooltip />
</PieChart>

        {/* TEXT */}
        <p className="text-2xl text-[#00f0ff] mt-4">
          {percentage}% done
        </p>

        <p className="text-gray-400 text-sm">
          {completedTasks} / {totalTasks} tasks completed
        </p>

      </div>

    </div>

  </div>
)}
{activeTab === "streak" && (
  <div className="w-full max-w-3xl mx-auto">

    <div className="rounded-2xl p-8
      bg-gradient-to-br from-[#0a0a0a]/80 to-[#0a0a0a]/40
      border border-[#00f0ff]/20 backdrop-blur-xl
      shadow-[0_0_40px_rgba(0,240,255,0.15)]">

      <h2 className="text-3xl text-[#00f0ff] mb-6 text-center">
        My Streak 🔥
      </h2>

      {/* MAIN STREAK */}
      <div className="text-center">
        <p className="text-5xl font-bold text-[#00f0ff]">
          {streak || 0}
        </p>
        <p className="text-gray-400 mt-2">
          Day Streak
        </p>
      </div>

      {/* MESSAGE */}
<p className="text-center text-gray-300 mt-6">
  {streakMessage}
</p>
{milestone && (
  <p className="text-[#00f0ff] text-sm text-center mt-2">
    {milestone}
  </p>
)}

{/* 🔥 ADD THIS EXACTLY BELOW */}
{warning && (
  <p className="text-yellow-400 text-sm text-center mt-4">
    {warning}
  </p>
)}

    </div>

  </div>
)}

      {activeTab === "profile" && (
  <div className="w-full max-w-md mx-auto md:mx-0">

    <div className="border border-[#00f0ff]/20 rounded-xl p-6 space-y-4">

      {/* TITLE */}
      {activeTab === "profile" && (
  <div className="w-full max-w-md mx-auto md:mx-0">

    <div className="border border-[#00f0ff]/20 rounded-xl p-6 space-y-4 text-center">

      {/* 🔥 AVATAR */}
      <div className="flex justify-center">
        {userPhoto ? (
          <img
            src={userPhoto}
            className="w-20 h-20 rounded-full object-cover border border-[#00f0ff]"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[#00f0ff] flex items-center justify-center text-black text-2xl font-bold">
            {username?.charAt(0).toUpperCase() || "U"}
          </div>
        )}
      </div>

      {/* NAME */}
      <h2 className="text-xl text-[#00f0ff] font-semibold">
        {username || "User"}
      </h2>

      {/* EMAIL */}
      <p className="text-gray-400 text-sm">
        {user?.email}
      </p>

      {/* JOIN DATE */}
      <div>
        <p className="text-gray-400 text-sm">Joined</p>
        <p className="text-lg">
          {user?.metadata?.creationTime
            ? new Date(user.metadata.creationTime).toLocaleDateString()
            : "N/A"}
        </p>
      </div>

      {/* UID */}
      <div>
        <p className="text-gray-400 text-sm">User ID</p>
        <p className="text-xs text-gray-500 break-all">
          {user?.uid}
        </p>
      </div>

    </div>
  </div>
)}


      {/* USERNAME */}
      <div className="flex items-center justify-between">
  <div>
    <p className="text-gray-400 text-sm">Username</p>

    {isEditingName ? (
      <>
        <input
          value={newUsername}
          onChange={(e) => {
            setNewUsername(e.target.value);
            setUsernameError(""); // 🔥 clear error while typing
          }}
          className="bg-black border border-[#00f0ff]/20 rounded px-2 py-1"
        />

        {/* 🔥 ERROR MESSAGE GOES HERE */}
        {usernameError && (
          <p className="text-red-400 text-xs mt-1">
            {usernameError}
          </p>
        )}
      </>
    ) : (
      <p className="text-lg">{username || "Not set"}</p>
    )}
  </div>

  <button
  onClick={() => {
    setIsEditingName(true);
    setNewUsername(username || "");
  }}
>
    ✏️
  </button>
</div>
{/* 🔥 BIO SECTION */}
<div className="flex items-center justify-between mt-4">
  <div className="w-full">
    <p className="text-gray-400 text-sm">Bio</p>

    {isEditingBio ? (
      <textarea
        value={newBio}
        onChange={(e) => setNewBio(e.target.value)}
        className="w-full bg-black border border-[#00f0ff]/20 rounded px-2 py-1"
      />
    ) : (
      <p className="text-sm text-gray-300">
        {bio || "No bio added"}
      </p>
    )}
  </div>

  <button
  onClick={() => {
    setIsEditingBio(true);
    setNewBio(bio || "");
  }}
>
  ✏️
</button>
</div>

      {/* EMAIL */}
      <div>
        <p className="text-gray-400 text-sm">Email</p>
        <p className="text-lg">{user?.email}</p>
      </div>

      {/* JOIN DATE */}
      <div>
        <p className="text-gray-400 text-sm">Joined</p>
        <p className="text-lg">
          {user?.metadata?.creationTime
            ? new Date(user.metadata.creationTime).toLocaleDateString()
            : "N/A"}
        </p>
      </div>

      {/* UID (OPTIONAL SMALL TEXT) */}
      <div>
        <p className="text-gray-400 text-sm">User ID</p>
        <p className="text-xs text-gray-500 break-all">
          {user?.uid}
        </p>
      </div>
      {(isEditingName || isEditingBio) && (
  <button
    onClick={handleSaveProfile}
    className="w-full mt-4 border border-[#00f0ff] text-[#00f0ff] py-2 rounded-lg hover:bg-[#00f0ff]/10 transition"
  >
    Save Changes
  </button>
)}

    </div>
  </div>
)}

    </div>

    {/* MOBILE BOTTOM NAV */}
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0a0a0a] border-t border-[#00f0ff]/20 flex justify-around py-3">

      <button onClick={() => setActiveTab("home")}>🏠</button>
      <button onClick={() => setActiveTab("courses")}>📚</button>
      <button onClick={() => setActiveTab("profile")}>👤</button>

    </div>

  </div>
</div>


);
}
