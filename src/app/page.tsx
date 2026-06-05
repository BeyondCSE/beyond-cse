"use client";
import { Suspense } from "react";
export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Orbitron } from "next/font/google";
import NetworkBackground from "@/components/NetworkBackground";
import AuthModal from "@/components/AuthModal";
import MobileNetwork from "@/components/MobileNetwork";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { FaInstagram, FaLinkedin } from "react-icons/fa";
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "600"],
});

import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { 
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  limit,
  where,
  getDocs,
  updateDoc,
arrayUnion,
arrayRemove,
  deleteDoc
} from "firebase/firestore";

export default function Home() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
function HomeContent() {
const router = useRouter();

  // ✅ ALL STATES FIRST
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [timeNow, setTimeNow] = useState(Date.now());

  // ❌ this is now useless (you can remove it)
  // const [showAuth, setShowAuth] = useState(false);

  // ✅ SEARCH PARAMS
  const searchParams = useSearchParams();
  const authMode = searchParams.get("auth");

  // ✅ NOW useEffect (correct place)
  useEffect(() => {
    if (!authMode || user) return;

    if (authMode === "signup") {
      setIsOpen(true);
      setMode("signup");
    }

    if (authMode === "login") {
      setIsOpen(true);
      setMode("login");
    }

    if (typeof window !== "undefined") {
  const url = new URL(window.location.href);
  url.searchParams.delete("auth");
  window.history.replaceState({}, "", url.pathname);
}

  }, [authMode, user]);
  

  const [usernameInput, setUsernameInput] = useState("");
  const [error, setError] = useState("");
  const [loadingUsername, setLoadingUsername] = useState(false);

  const [activeTab, setActiveTab] = useState("about");
  const [chatMode, setChatMode] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [displayText, setDisplayText] = useState("");
  const [editingMessageId, setEditingMessageId] = useState("");
const [editedText, setEditedText] = useState("");
  const ADMIN_UIDS = [
  "9xLGzmKruUTNZGx1FMYZJciKbvO2"
  
];
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [dashboardMode, setDashboardMode] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setUsername(null);
        return;
      }

      const userRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists() && snap.data().username) {
        setUsername(snap.data().username);
      }
    });

    return () => unsubscribe();
  }, []);
  useEffect(() => {
  if (!chatMode) return;

  

const q = query(
  collection(db, "messages"),
  where("expireAt", ">", new Date()), // 🔥 filter active messages
  orderBy("createdAt", "desc"),
  limit(30)
);

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const msgs: any[] = [];

    snapshot.forEach((doc) => {
      msgs.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    setMessages(msgs.reverse());
  });

  return () => unsubscribe();
}, [chatMode]);
useEffect(() => {
  const fullText = "Beginning to go Beyond";
  let index = 0;

  const interval = setInterval(() => {
    setDisplayText(fullText.slice(0, index + 1));
    index++;

    if (index === fullText.length) {
      clearInterval(interval);
    }
  }, 70); // speed (lower = faster)

  return () => clearInterval(interval);
}, []);
useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);
useEffect(() => {
  const interval = setInterval(() => {
    setTimeNow(Date.now());
  }, 60000); // every 1 min

  return () => clearInterval(interval);
}, []);
useEffect(() => {
  cleanupMessages(); // run once immediately

  const interval = setInterval(() => {
    cleanupMessages();
  }, 5 * 60 * 1000); // every 5 minutes

  return () => clearInterval(interval);
}, []);
  const sendMessage = async () => {
  console.log("🚀 Function triggered");

  if (!newMessage.trim()) {
    console.log("❌ Empty message");
    return;
  }

  if (!user) {
    console.log("❌ User missing");
    return;
  }

  if (!username) {
    console.log("❌ Username missing");
    return;
  }

  try {
    console.log("📡 Sending to Firebase...");

    const docRef = await addDoc(collection(db, "messages"), {
      text: newMessage,
      username: username,
      uid: user.uid,
      isAdmin: ADMIN_UIDS.includes(user.uid),
      createdAt: serverTimestamp(),
      expireAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
    });

    

    setNewMessage("");
  } catch (error) {
    console.error("🔥 FIRESTORE ERROR:", error);
  }
};

  const handleSetUsername = async () => {
  if (!user) return;

  setError("");

  const rawUsername = usernameInput.trim();
  const clean = rawUsername.toLowerCase().replace(/\s+/g, "");

  if (!rawUsername) {
    setError("Username cannot be empty");
    return;
  }

  setLoadingUsername(true);

  try {
    const userRef = doc(db, "users", user.uid);
    const usernameRef = doc(db, "usernames", clean);

    // 🔥 GET CURRENT USER DATA
    const userSnap = await getDoc(userRef);
    const oldUsernameKey = userSnap.exists()
      ? userSnap.data().usernameKey
      : null;

    // 🔥 CHECK IF NEW USERNAME EXISTS
    const existing = await getDoc(usernameRef);

    if (existing.exists() && existing.data().uid !== user.uid) {
      setError("❌ Username already exists");
      setLoadingUsername(false);
      return;
    }

    // 🔥 DELETE OLD USERNAME (IMPORTANT)
    if (oldUsernameKey && oldUsernameKey !== clean) {
      await deleteDoc(doc(db, "usernames", oldUsernameKey));
    }

    // 🔥 SAVE NEW USERNAME
    await setDoc(usernameRef, {
      uid: user.uid,
    });

    // 🔥 UPDATE USER DOC
    await setDoc(userRef, {
      username: rawUsername,
      usernameKey: clean,
      email: user.email,
    });

    setUsername(rawUsername);

  } catch (err) {
    console.error(err);
    setError("⚠️ Something went wrong");
  }

  setLoadingUsername(false);
};
const cleanupMessages = async () => {
  const now = new Date();

  const q = query(
    collection(db, "messages"),
    where("expireAt", "<=", now)
  );

  const snapshot = await getDocs(q);

  snapshot.forEach(async (docItem) => {
    await deleteDoc(docItem.ref);
  });
};
const getTimeLeft = (expireAt: any) => {
  if (!expireAt) return "";

  const now = new Date();
  const expiry = expireAt.toDate ? expireAt.toDate() : new Date(expireAt);

  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return "Expired";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
};
const reactToMessage = async (
  messageId: string,
  emoji: string,
  reactions: any = {}
) => {
  if (!user) return;

  const messageRef = doc(db, "messages", messageId);

  const usersReacted = reactions?.[emoji] || [];

  const alreadyReacted = usersReacted.includes(user.uid);

  try {
    await updateDoc(messageRef, {
      [`reactions.${emoji}`]: alreadyReacted
        ? arrayRemove(user.uid)
        : arrayUnion(user.uid),
    });
  } catch (err) {
    console.error(err);
  }
};
const saveEditedMessage = async (messageId: string) => {
  if (!editedText.trim()) return;

  try {
    await updateDoc(doc(db, "messages", messageId), {
      text: editedText,
      edited: true,
    });

    setEditingMessageId("");
    setEditedText("");
  } catch (err) {
    console.error(err);
  }
};

  return (
    <main className="relative w-full min-h-screen bg-black overflow-hidden text-white">

      {/* Background */}
{/* 💻 Desktop Background (UNCHANGED) */}
{/* 💻 Desktop Background (UNCHANGED) */}
{/* Desktop */}
<div className="hidden md:block absolute inset-0 z-0">
  <NetworkBackground />
</div>

{/* Mobile */}
<div className="md:hidden absolute inset-0 z-0">
  <MobileNetwork />
</div>
      <div className="relative z-10 mt-28 flex justify-center text-center">

  <p className={`${orbitron.className} text-gray-300 
text-lg sm:text-xl md:text-2xl 
tracking-wider 
max-w-[90%] md:max-w-4xl 
leading-relaxed`}>

  {displayText.includes("Beyond") ? (
    <>
      {displayText.replace("Beyond", "")}
      <span className="text-[#48C6EF]">Beyond</span>
    </>
  ) : (
    displayText
  )}

  <span className="animate-pulse text-[#00f0ff]">|</span>
</p>

</div>
      <div className="absolute top-4 left-[4px] md:left-[6px] z-20 flex items-center">

  <Image
    src="/logo5.png"
    alt="Beyond CSE Logo"
    width={220}
    height={220}
    className="object-contain w-[130px] sm:w-[150px] md:w-[220px] h-auto"
  />

</div>

      {/* TOP RIGHT */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        {!user ? (
          <>
            <button
  onClick={() => { setMode("login"); setIsOpen(true); }}
  className="w-[85px] sm:w-[95px] md:w-[110px] 
  h-[34px] sm:h-[36px] md:h-[40px] 
  text-xs sm:text-sm 
  text-[#00f0ff] border border-[#00f0ff] rounded-lg 
  bg-white/5 hover:bg-[#00f0ff]/10 transition 
  shadow-[0_0_10px_#00f0ff] hover:shadow-[0_0_20px_#00f0ff]"
>
  Login
</button>

<button
  onClick={() => { setMode("signup"); setIsOpen(true); }}
  className="w-[85px] sm:w-[95px] md:w-[110px] 
  h-[34px] sm:h-[36px] md:h-[40px] 
  text-xs sm:text-sm 
  text-[#00f0ff] border border-[#00f0ff] rounded-lg 
  bg-white/5 hover:bg-[#00f0ff]/10 transition 
  shadow-[0_0_10px_#00f0ff] hover:shadow-[0_0_20px_#00f0ff]"
>
  Sign Up
</button>
          </>
        ) : (
          <>
            <span className="text-[#00f0ff] text-sm">
              {username || "Set Username"}
            </span>

            <button onClick={() => signOut(auth)}
              className="px-4 py-2 text-sm text-red-400 border border-red-400 rounded-lg hover:bg-red-400/10 transition">
              Logout
            </button>
          </>
        )}
      </div>

      {/* USERNAME INPUT */}
      {user && !username && (
        <div className="relative z-10 mt-24 flex flex-col items-center gap-4">
          <input
            type="text"
            placeholder="Choose a unique username"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            className="px-4 py-2 rounded-lg bg-black border border-[#00f0ff] text-white w-[260px]"
          />

          <button
            onClick={handleSetUsername}
            disabled={loadingUsername}
            className="px-6 py-2 text-[#00f0ff] border border-[#00f0ff] rounded-lg hover:bg-[#00f0ff]/10 shadow-[0_0_10px_#00f0ff]"
          >
            {loadingUsername ? "Checking..." : "Save Username"}
          </button>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      )}

      {/* TABS CONTAINER (UPDATED 🔥) */}
      <div className="relative z-10 pt-12 md:pt-20 px-4">
        <div className="hidden md:block max-w-5xl mx-auto rounded-2xl px-6 py-4
  bg-gradient-to-br from-[#0a0a0a]/80 to-[#0a0a0a]/40
  border border-[#00f0ff]/20 backdrop-blur-xl
  shadow-[0_0_30px_rgba(0,240,255,0.12)]
  hover:shadow-[0_0_60px_rgba(0,240,255,0.25)]
  hover:-translate-y-1
  transition-all duration-500">

          <div className="hidden md:flex flex-wrap justify-center gap-3">
            {[
              { key: "about", label: "About Us" },
              { key: "mission", label: "Our Mission" },
              { key: "courses", label: "Courses" },
              { key: "roadmaps", label: "Roadmaps" },
              { key: "community", label: "Community" },
              { key: "announcements", label: "Announcements" },
              { key: "challenge", label: "Challenge" },
              { key: "events", label: "Events" },
              { key: "dashboard", label: "My Dashboard" },
              { key: "support", label: "Support" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 md:px-5 py-2 text-sm 
rounded-lg whitespace-nowrap
transition-all duration-300 ${
  activeTab === tab.key
    ? "border border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_20px_#00f0ff] scale-105"
    : "text-gray-400 hover:text-[#00f0ff] hover:bg-[#00f0ff]/5 hover:shadow-[0_0_10px_#00f0ff]"
}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* 📱 MOBILE NAV GRID */}
{/* MOBILE NAV GRID */}
<div className="md:hidden mt-6 px-4 relative z-20">

  <div className="grid grid-cols-2 gap-3">

    {[
      { key: "about", label: "About Us" },
      { key: "mission", label: "Our Mission" },
      { key: "courses", label: "Courses" },
      { key: "roadmaps", label: "Roadmaps" },
      { key: "community", label: "Community" },
      { key: "announcements", label: "Announcements" },
      { key: "challenge", label: "Challenge" },
      { key: "events", label: "Events" },
      { key: "dashboard", label: "My Dashboard" },
      { key: "support", label: "Support" },
    ].map((tab) => (
      <button
        key={tab.key}
        onClick={() => setActiveTab(tab.key)}
        className={`p-4 rounded-xl text-sm text-center transition-all duration-300 ${
  activeTab === tab.key
    ? "bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff] shadow-[0_0_20px_#00f0ff] scale-105"
    : "bg-[#111] text-gray-300 border border-white/5 active:scale-95"
}`}
      >
        {tab.label}
      </button>
    ))}

  </div>
</div>

      {/* CONTENT */}
      <div className="relative z-10 mt-8 md:mt-12 flex justify-center px-4">
        <div key={activeTab} className="animate-fadeSlide w-full flex justify-center">

          {/* ABOUT */}
          {activeTab === "about" && (
            <div className="w-full sm:w-[90%] md:w-[80%] max-w-5xl rounded-2xl p-4 md:p-8
bg-gradient-to-br from-[#0a0a0a]/80 to-[#0a0a0a]/40
border border-[#00f0ff]/20 backdrop-blur-xl
shadow-[0_0_40px_rgba(0,240,255,0.15)]
hover:shadow-[0_0_80px_rgba(0,240,255,0.3)]
hover:-translate-y-1
transition-all duration-500">

              <h2 className="text-2xl md:text-4xl text-[#00f0ff] mb-6
hover:drop-shadow-[0_0_30px_#00f0ff] transition">
                About Us
              </h2>

              <div className="space-y-6 text-gray-300 leading-relaxed">
                <p>Beyond CSE is a student-driven platform and community focused on helping students navigate and grow in the world of technology with clarity, direction, and real understanding.</p>

                <p>In today’s fast-growing tech landscape, many students choose Computer Science and related fields influenced by trends, peer pressure, or the idea of high-paying jobs—often without fully understanding what the field demands or what truly suits them. This leads to confusion, lack of direction, and a gap between expectations and reality.</p>

                <p className="text-[#00f0ff] font-medium">Beyond CSE was built to bridge this gap.</p>

                <p>We are not just about awareness—we are a community of learners, builders, and future professionals who believe that the right guidance at the right time can transform a student’s entire journey. Our goal is to help students move beyond confusion and build a clear, structured path in their tech careers.</p>

                <div>
                  <p className="text-[#00f0ff] mb-2 font-medium">At Beyond CSE, we focus on:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Bringing clarity to career choices in technology</li>
                    <li>Helping students understand real industry expectations</li>
                    <li>Guiding them in building relevant skills and mindset</li>
                    <li>Providing a step-by-step direction from learning to growth</li>
                  </ul>
                </div>

                <p>We actively collaborate with schools, colleges, and student communities through seminars, sessions, and interactive engagements. But beyond that, we are building a space where students can continuously learn, connect, and grow together.</p>

                <p>Beyond CSE is evolving into a platform where students don’t just gain awareness—they gain direction, skills, and a community that supports their journey.</p>

                <p>We believe that growth in tech is not just about learning more, but about learning right, building consistently, and moving with clarity.</p>

                <div className="pt-4 border-t border-[#00f0ff]/20">
                  <p className="text-[#00f0ff] font-medium">Beyond CSE is not just a name.</p>
                  <p className="text-gray-400">It is a mindset—to think beyond trends, beyond assumptions, and beyond limits.</p>
                </div>
                {/* 🔥 CONNECT SECTION */}
<div className="pt-6 border-t border-[#00f0ff]/20 mt-6">

  <p className="text-[#00f0ff] font-medium mb-3">
    Connect With Beyond CSE
  </p>

  <a
    href="https://www.instagram.com/beyond.cse/"
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 text-gray-300 hover:text-[#00f0ff] transition"
  >
    <FaInstagram className="text-xl" />
    <span>Beyond CSE</span>
  </a>
  <a
  href="https://www.linkedin.com/company/beyond-cse/"
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-2 text-gray-300 hover:text-[#00f0ff] transition mt-2"
>
  <FaLinkedin className="text-xl" />
  <span>Beyond CSE</span>
</a>

</div>
              </div>
            </div>
          )}
          {activeTab === "dashboard" && (
  <div className="w-full sm:w-[90%] md:w-[80%] max-w-5xl rounded-2xl p-4 md:p-8
bg-gradient-to-br from-[#0a0a0a]/80 to-[#0a0a0a]/40
border border-[#00f0ff]/20 backdrop-blur-xl
shadow-[0_0_40px_rgba(0,240,255,0.15)]
hover:shadow-[0_0_80px_rgba(0,240,255,0.3)]
hover:-translate-y-1
transition-all duration-500">

    <h2 className="text-2xl md:text-4xl text-[#00f0ff] mb-6">
      My Dashboard
    </h2>

    <div className="text-gray-300 space-y-6 text-center">

      <p className="text-xl text-[#00f0ff]">
        🚀 Welcome to Your Dashboard
      </p>

      <p>
        This is your personal space where you will track your progress,
        explore your journey, and unlock new features.
      </p>

      <p>
        We are building something powerful for you — stay tuned!
      </p>

      {/* 🔥 OPEN DASHBOARD BUTTON */}
      <button
        onClick={() => router.push("/dashboard")}
        className="mt-6 px-4 py-2 md:px-6 md:py-3 text-[#00f0ff] border border-[#00f0ff]
rounded-lg hover:bg-[#00f0ff]/10 transition
shadow-[0_0_15px_#00f0ff] hover:shadow-[0_0_30px_#00f0ff]"
      >
        Open Dashboard 📊
      </button>

    </div>

  </div>
)}

          {/* MISSION */}
          {activeTab === "mission" && (
            <div className="w-full sm:w-[90%] md:w-[80%] max-w-5xl rounded-2xl p-4 md:p-8
bg-gradient-to-br from-[#0a0a0a]/80 to-[#0a0a0a]/40
border border-[#00f0ff]/20 backdrop-blur-xl
shadow-[0_0_40px_rgba(0,240,255,0.15)]
hover:shadow-[0_0_80px_rgba(0,240,255,0.3)]
hover:-translate-y-1
transition-all duration-500">

              <h2 className="text-2xl md:text-4xl text-[#00f0ff] mb-6
hover:drop-shadow-[0_0_30px_#00f0ff] transition">
                Our Mission – Beyond CSE
              </h2>

              <div className="space-y-6 text-gray-300 leading-relaxed">
                <p>At Beyond CSE, our mission is to transform the way students approach careers in technology by replacing confusion, assumptions, and trend-driven decisions with clarity, awareness, and purposeful action.</p>

                <p>We aim to build a generation of students who do not blindly follow popular career paths, but instead understand their choices, align them with their strengths, and take informed steps towards long-term growth in the tech industry.</p>

                <p>In today’s ecosystem, students are exposed to an overwhelming number of options, opinions, and expectations. However, very few are given the right direction at the right time. This results in students entering fields without clarity, struggling to keep up, or realizing too late that they chose a path they never truly understood.</p>

                <p className="text-[#00f0ff] font-medium">Our mission is to change this narrative.</p>

                <p>We are committed to guiding students at every stage—whether they are in school exploring their interests or in college trying to find direction—by helping them:</p>

                <ul className="list-disc pl-6 space-y-2">
                  <li>Understand the reality of the tech industry, beyond hype and misconceptions</li>
                  <li>Discover diverse career paths that exist beyond traditional roles</li>
                  <li>Develop the right mindset, skills, and habits required to succeed</li>
                  <li>Avoid common mistakes that lead to wasted time, effort, and opportunities</li>
                  <li>Build a clear, structured roadmap for their growth</li>
                </ul>

                <p>Beyond awareness, our mission extends to building a strong ecosystem where students are not left alone after gaining initial clarity.</p>

                <p>Through mentorship, structured learning, and real-world exposure, we want to ensure that students are not just informed, but also equipped to take action.</p>

                <p>At its core, Beyond CSE exists to ensure that students:</p>

                <ul className="list-disc pl-6 space-y-2">
                  <li>Don’t choose careers based on trends</li>
                  <li>Don’t rely on incomplete or misleading information</li>
                  <li>Don’t realize their mistakes when it’s too late</li>
                </ul>

                <p>Instead, we want them to move forward with:</p>

                <ul className="list-disc pl-6 space-y-2">
                  <li>Confidence in their decisions</li>
                  <li>Clarity in their direction</li>
                  <li>Consistency in their efforts</li>
                </ul>

                <p>Our mission is not limited to helping students start their journey—it is about supporting them throughout their growth.</p>

                <p>We believe that when students are guided correctly, they don’t just build better careers—they build better futures.</p>

                <p className="text-[#00f0ff] font-medium">
                  Our mission is simple — to replace confusion with clarity, and potential with progress.
                </p>
                {/* 🔥 FOUNDERS CONNECT SECTION */}
<div className="pt-6 border-t border-[#00f0ff]/20 mt-6">

  <p className="text-[#00f0ff] font-medium mb-4">
    Connect With Us
  </p>

  {/* 👤 YOU */}
  <a
    href="https://www.linkedin.com/in/prem-kumar-a68567390/"
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center justify-between p-3 rounded-lg 
    bg-[#111]/60 border border-[#00f0ff]/10
    hover:border-[#00f0ff] hover:shadow-[0_0_20px_#00f0ff]/20
    transition mb-3"
  >
    <div>
      <p className="text-white font-medium">Prem Kumar</p>
      <p className="text-gray-400 text-sm">Founder, Beyond CSE</p>
    </div>

    <FaLinkedin className="text-xl text-[#00f0ff]" />
  </a>

  

</div>

              </div>
            </div>
          )}

          {activeTab === "courses" && (
  <div className="w-full sm:w-[90%] md:w-[80%] max-w-5xl rounded-2xl p-4 md:p-8
bg-gradient-to-br from-[#0a0a0a]/80 to-[#0a0a0a]/40
border border-[#00f0ff]/20 backdrop-blur-xl
shadow-[0_0_40px_rgba(0,240,255,0.15)]
hover:shadow-[0_0_80px_rgba(0,240,255,0.3)]
hover:-translate-y-1
transition-all duration-500">

    <h2 className="text-2xl md:text-4xl text-[#00f0ff] mb-6
hover:drop-shadow-[0_0_30px_#00f0ff] transition">
      Courses
    </h2>

    <div className="text-gray-300 text-lg text-center">
      🎓 Courses coming soon... Stay tuned for high-quality learning content!
    </div>

  </div>
)}
          {activeTab === "roadmaps" && (
  <div className="w-full sm:w-[90%] md:w-[80%] max-w-5xl rounded-2xl p-4 md:p-8
bg-gradient-to-br from-[#0a0a0a]/80 to-[#0a0a0a]/40
border border-[#00f0ff]/20 backdrop-blur-xl
shadow-[0_0_40px_rgba(0,240,255,0.15)]
hover:shadow-[0_0_80px_rgba(0,240,255,0.3)]
hover:-translate-y-1
transition-all duration-500">

    <h2 className="text-2xl md:text-4xl text-[#00f0ff] mb-6
hover:drop-shadow-[0_0_30px_#00f0ff] transition">
      Roadmaps
    </h2>

    <div className="text-gray-300 text-lg text-center">
      🚧 Roadmaps coming soon... Stay tuned for structured learning paths!
    </div>

  </div>
)}
{activeTab === "announcements" && (
  <div className="w-full sm:w-[90%] md:w-[80%] max-w-5xl rounded-2xl p-4 md:p-8
bg-gradient-to-br from-[#0a0a0a]/80 to-[#0a0a0a]/40
border border-[#00f0ff]/20 backdrop-blur-xl
shadow-[0_0_40px_rgba(0,240,255,0.15)]
hover:shadow-[0_0_80px_rgba(0,240,255,0.3)]
hover:-translate-y-1
transition-all duration-500">

    <h2 className="text-2xl md:text-4xl text-[#00f0ff] mb-6
hover:drop-shadow-[0_0_30px_#00f0ff] transition">
      Announcements
    </h2>

    <div className="text-gray-300 text-sm md:text-lg space-y-5 md:space-y-6 leading-relaxed text-center">

      <p className="text-[#00f0ff] text-xl font-medium">
        🚀 Welcome to Beyond CSE
      </p>

      <p>
        We’re excited to have you here. Beyond CSE is more than just a platform — 
        it’s a growing community of students who are learning, building, and moving 
        forward together in the world of technology.
      </p>

      <p>
        This is just the beginning. In the coming days, we’ll be rolling out 
        structured roadmaps, high-quality courses, and an interactive community 
        where you can connect, learn, and grow.
      </p>

      <p>
        Stay consistent, stay curious, and most importantly — keep building.
      </p>

      <div className="pt-6 border-t border-[#00f0ff]/20 flex justify-between items-center gap-2 md:gap-4">

  {/* LEFT - FOUNDER */}
  <div className="text-left flex-1">
    <p className="text-[#00f0ff] font-semibold text-lg
      hover:drop-shadow-[0_0_15px_#00f0ff] transition">
      Prem Kumar
    </p>
    <p className="text-gray-400 text-sm">
      Founder, Beyond CSE
    </p>
  </div>

  

</div>

    </div>
  </div>
)}
{activeTab === "challenge" && (
  <div className="w-full sm:w-[90%] md:w-[80%] max-w-5xl rounded-2xl p-4 md:p-8
bg-gradient-to-br from-[#0a0a0a]/80 to-[#0a0a0a]/40
border border-[#00f0ff]/20 backdrop-blur-xl
shadow-[0_0_40px_rgba(0,240,255,0.15)]
hover:shadow-[0_0_80px_rgba(0,240,255,0.3)]
hover:-translate-y-1
transition-all duration-500">

    <h2 className="text-2xl md:text-4xl text-[#00f0ff] mb-6
hover:drop-shadow-[0_0_30px_#00f0ff] transition">
      Daily Challenge
    </h2>

    <div className="text-gray-300 text-sm md:text-lg space-y-5 md:space-y-6 leading-relaxed text-center">

      <p>
        🚧 Your Daily Today's Challenge coming soon...
      </p>

      <p>
        We’re building a system where every day you’ll get a new challenge 
        designed to improve your logical thinking, problem-solving skills, 
        and consistency.
      </p>

      <p>
        Stay tuned — your daily growth journey is about to begin.
      </p>

    </div>

  </div>
)}
{activeTab === "events" && (
  <div className="w-full sm:w-[90%] md:w-[80%] max-w-5xl rounded-2xl p-4 md:p-8
bg-gradient-to-br from-[#0a0a0a]/80 to-[#0a0a0a]/40
border border-[#00f0ff]/20 backdrop-blur-xl
shadow-[0_0_40px_rgba(0,240,255,0.15)]
hover:shadow-[0_0_80px_rgba(0,240,255,0.3)]
hover:-translate-y-1
transition-all duration-500">

    <h2 className="text-2xl md:text-4xl text-[#00f0ff] mb-6
hover:drop-shadow-[0_0_30px_#00f0ff] transition">
      Events & Seminars
    </h2>

    <div className="text-gray-300 text-sm md:text-lg space-y-5 md:space-y-6 leading-relaxed text-center">

      <p>
        We are planning plenty of exciting events and seminars for you.
      </p>

      <p>
        From tech sessions to career guidance and interactive workshops, 
        we aim to bring opportunities that help you learn, connect, and grow.
      </p>

      <p>
        Stay tuned — something valuable is on the way.
      </p>

    </div>

  </div>
)}

          {activeTab === "community" && (
  <div className="w-full sm:w-[90%] md:w-[80%] max-w-5xl rounded-2xl p-4 md:p-8
bg-gradient-to-br from-[#0a0a0a]/80 to-[#0a0a0a]/40
border border-[#00f0ff]/20 backdrop-blur-xl
shadow-[0_0_40px_rgba(0,240,255,0.15)]
hover:shadow-[0_0_80px_rgba(0,240,255,0.3)]
hover:-translate-y-1
transition-all duration-500">

    {!chatMode ? (
      <>
        <h2 className="text-2xl md:text-4xl text-[#00f0ff] mb-6
hover:drop-shadow-[0_0_30px_#00f0ff] transition">
          Community
        </h2>

        <div className="text-gray-300 text-sm md:text-lg space-y-5 md:space-y-6 leading-relaxed text-center">

          <p className="text-[#00f0ff] text-xl font-medium">
            🌐 Beyond CSE Community
          </p>

          <p>
            Connect with like-minded students, share ideas, ask questions,
            and grow together in your tech journey.
          </p>

          <p>
            This is a space built for collaboration, learning, and real conversations.
          </p>

          <button
            onClick={() => {
              if (!user) {
                setMode("login");
                setIsOpen(true);
                return;
              }

              if (!username) {
                alert("Please set your username first.");
                return;
              }

              setChatMode(true);
            }}
            className="mt-6 px-4 py-2 md:px-6 md:py-3 text-[#00f0ff] border border-[#00f0ff]
rounded-lg hover:bg-[#00f0ff]/10 transition
shadow-[0_0_15px_#00f0ff] hover:shadow-[0_0_30px_#00f0ff]">
            Enter Chat Mode 💬
          </button>

        </div>
      </>
    ) : (
      <>
        <div className="flex items-center justify-between mb-4 md:mb-6 gap-2">

  <h2 className="text-lg md:text-4xl text-[#00f0ff] leading-tight">
    Beyond CSE Global Chat
  </h2>

  <button
    onClick={() => setChatMode(false)}
    className="px-2 py-1 text-xs md:px-4 md:py-2 md:text-sm 
text-red-400 border border-red-400 rounded-lg
hover:bg-red-400/10 transition
shadow-[0_0_10px_rgba(255,0,0,0.3)] hover:shadow-[0_0_20px_rgba(255,0,0,0.6)]"
  >
    Exit ✖
  </button>

</div>

        <div className="flex flex-col h-[60vh] md:h-[400px]">

  {/* MESSAGES */}
  <div className="flex-1 overflow-y-auto space-y-3 mb-4 px-2">
  {messages.map((msg) => (
    <div key={msg.id} className="bg-[#111] p-3 rounded-lg border border-[#00f0ff]/20">

      <p className="text-[#00f0ff] text-sm font-semibold flex items-center gap-1">
        {msg.username}

        {msg.isAdmin && (
          <span className="ml-1 flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold shadow-[0_0_8px_#3b82f6]">
            ✓
          </span>
        )}
      </p>

      <div className="flex items-start justify-between gap-3">

  {/* MESSAGE CONTENT */}
  <div className="flex-1">

    {editingMessageId === msg.id ? (
      <div className="flex flex-col gap-2">

        <input
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          className="bg-black border border-[#00f0ff]/20 rounded px-3 py-2 text-white"
        />

        <div className="flex gap-2">
          <button
            onClick={() => saveEditedMessage(msg.id)}
            className="text-xs text-[#00f0ff]"
          >
            Save
          </button>

          <button
            onClick={() => {
              setEditingMessageId("");
              setEditedText("");
            }}
            className="text-xs text-gray-400"
          >
            Cancel
          </button>
        </div>

      </div>
    ) : (
      <>
        <p className="text-gray-300 break-words">
          {msg.text}
        </p>

        {msg.edited && (
          <p className="text-xs text-gray-500 mt-1">
            edited
          </p>
        )}
      </>
    )}

  </div>

  {/* ACTIONS */}
  {(user?.uid === msg.uid ||
    ADMIN_UIDS.includes(user?.uid || "")) && (

    <div className="flex gap-2">

      {/* EDIT */}
      {user?.uid === msg.uid && (
        <button
          onClick={() => {
            setEditingMessageId(msg.id);
            setEditedText(msg.text);
          }}
          className="text-blue-400 text-xs hover:text-blue-300 transition"
        >
          Edit
        </button>
      )}

      {/* DELETE */}
      <button
        onClick={async () => {
          try {
            await deleteDoc(doc(db, "messages", msg.id));
          } catch (err) {
            console.error(err);
          }
        }}
        className="text-red-400 text-xs hover:text-red-300 transition"
      >
        Delete
      </button>

    </div>
  )}
</div>
<div className="flex gap-2 mt-2 flex-wrap">
  {["❤️", "🔥", "😂", "👍"].map((emoji) => {
    const count = msg.reactions?.[emoji]?.length || 0;
    const reacted = msg.reactions?.[emoji]?.includes(user?.uid);

    return (
      <button
        key={emoji}
        onClick={() =>
          reactToMessage(msg.id, emoji, msg.reactions)
        }
        className={`px-2 py-1 rounded-full text-sm border transition
        ${
          reacted
            ? "bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff]"
            : "border-white/10 text-gray-300 hover:border-[#00f0ff]/40"
        }`}
      >
        {emoji} {count > 0 ? count : ""}
      </button>
    );
  })}
</div>
      <p className="text-xs text-gray-400 mt-1">
  Expires in {getTimeLeft(msg.expireAt)}
</p>

    </div>
  ))}

  {/* 👇 ADD THIS LINE HERE */}
  <div ref={bottomRef}></div>

</div>

  {/* INPUT */}
  <div className="flex gap-2 items-center">
    <input
  value={newMessage}
  onChange={(e) => setNewMessage(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  }}
  placeholder="Type your message..."
  className="flex-1 px-4 py-2 rounded-lg bg-[#0a0a0a] border border-[#00f0ff]/30 text-white"
/>

    <button
      onClick={sendMessage}
      className="px-3 py-2 md:px-4 md:py-2 text-sm md:text-base
border border-[#00f0ff] text-[#00f0ff] rounded-lg
hover:bg-[#00f0ff]/10 transition
shadow-[0_0_10px_#00f0ff] hover:shadow-[0_0_20px_#00f0ff]"
    >
      Send
    </button>
  </div>

</div>
      </>
    )}

  </div>
)}
          {activeTab === "support" && (
  <div className="w-full sm:w-[90%] md:w-[80%] max-w-5xl rounded-2xl p-4 md:p-8
bg-gradient-to-br from-[#0a0a0a]/80 to-[#0a0a0a]/40
border border-[#00f0ff]/20 backdrop-blur-xl
shadow-[0_0_40px_rgba(0,240,255,0.15)]
hover:shadow-[0_0_80px_rgba(0,240,255,0.3)]
hover:-translate-y-1
transition-all duration-500">

    <h2 className="text-2xl md:text-4xl text-[#00f0ff] mb-6
hover:drop-shadow-[0_0_30px_#00f0ff] transition">
      Support
    </h2>

    <div className="text-gray-300 text-sm md:text-lg space-y-5 md:space-y-6 leading-relaxed text-center">

      <p className="text-[#00f0ff] text-xl font-medium">
        💬 Need Help?
      </p>

      <p>
        If you’re facing any issues or have questions, feel free to reach out to us.
        We’re here to help you.
      </p>

      <p>
        📧 Email us at:
      </p>

      <p className="text-[#00f0ff] text-lg font-medium">
        beyondcse.support@gmail.com
      </p>

      <p>
        We usually respond within 24 to 48 hours.
      </p>

    </div>
  </div>
)}

        </div>
      </div>

      <AuthModal isOpen={isOpen} onClose={() => setIsOpen(false)} mode={mode} />
        </main>
  );
}