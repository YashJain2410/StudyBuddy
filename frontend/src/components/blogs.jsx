import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from "../context/AppContext";
import profileIcon from '../assets/profile_icon.png';

const initialBlogPosts = [
    {
        id: 1,
        title: "AI is Changing the Way We Learn!",
        author: "Ananya Sharma",
        image: "",
        excerpt: "ISRO’s latest space mission reminds us how science, teamwork, and dreams can take India and young minds beyond the stars.",
        fullContent: "Today I came across an AI-powered study app that tracks your focus level, mood, and even how long you stay distracted — and then creates a personalized study plan for you! It felt like having a private digital mentor who actually understands how your brain works. The app suggested short breaks when my attention dropped and encouraged me to revise difficult topics when my mind was fresh. I realized that artificial intelligence isn’t just about robots or coding — it’s about making learning smarter, faster, and more human. The future classrooms might not even need fixed timetables; they’ll adjust to how we learn best. Isn’t that amazing? 🤖✨"
    },
    {
        id: 2,
        title: "India’s Rocket Launch – What a Proud Moment!",
        author: "Rajesh Kumar",
        image: "",
        excerpt: "ISRO’s latest space mission reminds us how science, teamwork, and dreams can take India and young minds beyond the stars.!",
        fullContent: "Last night, I watched ISRO’s latest rocket launch live on YouTube, and I couldn’t take my eyes off the screen! The countdown, the fire, the takeoff — it was pure magic. The scientists behind it worked for months, maybe years, for those few incredible seconds. It made me think about how much patience and teamwork science really needs. Every small calculation matters. Watching that rocket fly into space gave me goosebumps and filled me with pride. It reminded me that when we study hard and stay curious, we too can reach for the stars — literally! 🌌🇮🇳"
    },
    {
        id: 3,
        title: "Climate Change: Our Responsibility Too",
        author: "Rishabh Singh",
        image: "",
        excerpt: "Global warming is rising faster than ever — and it’s time for students to lead change through awareness, innovation, and daily eco-friendly habits.",
        fullContent: "While researching for my environmental science project, I found out that 2025 has already recorded some of the hottest months in human history. Forest fires, melting glaciers, and rising sea levels are no longer distant headlines — they’re happening right now. It honestly made me pause and think: if we, the students of today, don’t take responsibility, who will? I’ve started doing small things like using metal bottles instead of plastic, turning off lights when not needed, and encouraging my friends to do the same. These small habits may seem minor, but together they can make a big difference. 🌱💚"
    },
    {
        id: 4,
        title: "Imagine Studying in the Metaverse!",
        author: "Anjilesh Sharma",
        image: "",
        excerpt: "Virtual classrooms in the metaverse will let students explore planets, atoms, and history like real-life adventures — turning learning into pure experience.",
        fullContent: "I read this fascinating article about the future of virtual education, and it blew my mind. Imagine wearing a VR headset and attending a biology class inside a 3D model of the human body, or learning about planets while floating in a simulated solar system! That’s what metaverse learning promises — immersive, interactive, and super fun classes. You wouldn’t just read about a volcano; you’d actually walk around one (virtually). This idea made me realize how learning could soon become an adventure rather than a task. It’s like science fiction slowly turning into science fact! 🌐✨"
    },
    {
        id: 5,
        title: "When Coding Feels Like Magic",
        author: "Priya Das",
        image: "",
        excerpt: "Every student who codes feels the thrill of creation — transforming logical lines into ideas, tools, and digital worlds that inspire others.",
        fullContent: "Today I wrote my first real piece of code that actually worked — an AI chatbot that replied to my questions. At first, it was just random lines of text and logic that made no sense. But when it finally responded correctly, I literally jumped out of my chair! It felt like I made a machine understand me. That moment made me realize how creative coding can be. You’re not just typing commands; you’re building something that can think, calculate, and even communicate. For the first time, I felt what it means to create with logic — and it felt like magic. 💻💫"
    },
    {
        id: 6,
        title: "New Education Policy: Focusing on Real Learning",
        author: "Liam Chen",
        image: "",
        excerpt: "India’s new education system encourages creativity, skill-building, and curiosity — helping students grow beyond marks into confident, capable learners.",
        fullContent: "Recently, I read about the new education policy that’s being introduced in India. It focuses on skill development, creativity, and real-world understanding instead of rote learning and exams. As a student, that really excited me! I’ve always felt that grades don’t fully define what we’re capable of. The new policy encourages us to explore, question, and create rather than memorize and repeat. If schools start implementing it well, students will finally get the freedom to follow their passion — be it art, coding, music, or science — without fear of being judged just by marks. 📚🌟"
    },
    {
        id: 7,
        title: "A Science Fair Surprise!",
        author: "Aisha Chetry",
        image: "",
        excerpt: "Innovation starts small — even a simple banana battery can light up curiosity, creativity, and the spirit of discovery in every student.",
        fullContent: "During our annual school science fair, a junior student built a banana battery that could actually light up a small bulb! 🍌⚡ Everyone was amazed, and I couldn’t stop smiling. It was such a creative way to show how simple chemistry can generate real electricity. What impressed me most wasn’t just the idea, but the confidence with which the student explained it. That project reminded me that innovation doesn’t always need expensive equipment — it starts with curiosity, imagination, and the courage to experiment. Science isn’t just for geniuses; it’s for anyone who’s curious enough to try. 🔬"
    },
    {
        id: 8,
        title: "AI Drawing Tools Are Getting Crazy Good!",
        author: "Eshan Cher",
        image: "",
        excerpt: "AI art generators are teaching us how machines can be creative too — blending imagination, design, and technology like never before.",
        fullContent: "Today, I tried an AI art generator for fun. I just typed “a robot studying under the stars,” and within seconds it created a breathtaking digital painting! The colors, lighting, and composition were so good that it was hard to believe a machine made it. It made me realize how much technology is evolving — not just in logic, but in creativity too. AI tools are helping artists, students, and even teachers visualize ideas that were once hard to imagine. Maybe one day, AI and humans will co-create masterpieces together. 🎨🤖."
    },
    {
        id: 9,
        title: "FStudents and Space: The Next Big Dream",
        author: "Sara Khan",
        image: "",
        excerpt: "From school projects to mini satellites, young innovators worldwide are exploring the universe — proving that space belongs to dreamers too.",
        fullContent: "More and more students around the world are joining space clubs, robotics teams, and even satellite design programs. I recently read about a group of Indian students who helped design a mini satellite that was actually launched into orbit by ISRO! Isn’t that incredible? It shows that age doesn’t matter when it comes to innovation — curiosity does. I’ve started following such stories for motivation, and now I dream of contributing to something big too — maybe not a rocket, but perhaps an idea that reaches space someday. 🚀🌠."
    }
];

// The component name MUST be capitalized (PascalCase)
const Blog = () => {
    const [posts, setPosts] = useState(initialBlogPosts);
    const [isPremiumModalVisible, setPremiumModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const { appState } = useAppContext();
    const { user } = appState;
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            const res = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });

            const data = await res.json();

            // Remove user from storage & state regardless of API response
            localStorage.removeItem("user");
            setDropdownOpen(false);

            if (res.ok) {
                navigate("/");
            } else {
                console.error("Logout failed:", data.message);
            }
        } catch (error) {
            console.error("Error during logout:", error);
            // Ensure frontend logout even if server call fails
            localStorage.removeItem("user");
            setDropdownOpen(false);
            alert("An error occurred during logout.");
        }
    };

    return (
        <div className="blog-page-container">
            {/* Navbar */}
            <nav className="bg-white/30 backdrop-blur-lg shadow-lg py-4 px-8 flex justify-between items-center sticky top-0 z-50 rounded-b-2xl">
                <Link
                    to="/"
                    className="text-2xl font-extrabold bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 bg-clip-text text-transparent tracking-tight"
                >
                    StudyBuddy
                </Link>

                <div className="hidden md:flex gap-8 font-medium">
                    <Link
                        to="/dashboard"
                        className="hover:text-pink-500 transition-colors duration-300"
                    >
                        Dashboard
                    </Link>
                    <Link to="/videos" className="hover:text-pink-500 transition-colors duration-300">Video Tracker</Link>
                    <Link to="/analytics" className="hover:text-pink-500 transition-colors duration-300">Analytics</Link>
                    <Link to="/assignments" className="hover:text-pink-500 transition-colors duration-300">Assignments</Link>
                </div>

                {/* Conditional Navbar with Logout Dropdown */}
                {user ? (
                    <div className="relative">
                        {/* Clickable profile icon to toggle dropdown */}
                        <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center gap-3 cursor-pointer">
                            <img
                                src={user.profileImage || profileIcon}
                                alt="Profile"
                                className="w-10 h-10 rounded-full border-2 border-indigo-700"
                            />
                            <span className="font-semibold text-gray-900">{user.name}</span>
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-lg shadow-xl z-50">
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-100"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex gap-3">
                        <Link
                            to="/login"
                            className="px-4 py-2 border border-indigo-700 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-all duration-300"
                        >
                            Login
                        </Link>
                        <Link
                            to="/register"
                            className="px-4 py-2 bg-gradient-to-r from-indigo-700 to-pink-600 text-white rounded-lg shadow-xl hover:shadow-2xl hover:scale-105 transform transition-all duration-300"
                        >
                            Sign Up
                        </Link>
                    </div>
                )}
            </nav>

            <main className="container">
                <div className="add-blog-section">
                    <button onClick={() => setPremiumModalVisible(true)} className="add-blog-btn">Add Your Blog</button>
                    <div className={`premium-modal ${isPremiumModalVisible ? 'visible' : ''}`}>
                        <p>Buy Premium to Post a Blog</p>
                        <div className="button-container">
                            <a href="#" target="_blank" rel="noopener noreferrer" className="buy-btn">Buy Premium</a>
                            <button onClick={() => setPremiumModalVisible(false)} className="close-btn">Close</button>
                        </div>
                    </div>
                </div>

                <div className="blog-grid">
                    {posts.map(post => (
                        <div key={post.id} className="blog-card" onClick={() => setSelectedPost(post)}>
                            <div className="blog-header">
                                <div className="user-avatar">{post.image ? <img src={post.image} alt={post.author} /> : <i className="fa fa-user"></i>}</div>
                                <div className="user-name">{post.author}</div>
                            </div>
                            <div className="blog-content">
                                <h3>{post.title}</h3>
                                <p>{post.excerpt}</p>
                                <div className="read-more-btn">Read More</div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {selectedPost && (
                <div className="blog-full-view" style={{ display: 'flex' }}>
                    <div className="blog-full-content">
                        <span className="close-full-view" onClick={() => setSelectedPost(null)}>×</span>
                        <div className="full-blog-header">
                            <div className="user-avatar">{selectedPost.image ? <img src={selectedPost.image} alt={selectedPost.author} /> : <i className="fa fa-user"></i>}</div>
                            <div className="user-info">
                                <h2>{selectedPost.title}</h2>
                                <p>by {selectedPost.author}</p>
                            </div>
                        </div>
                        <div className="full-blog-content-text">
                            {selectedPost.fullContent.split('\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                /* The entire CSS block from your file */
                .blog-page-container {
                    font-family: 'Poppins', sans-serif;
                    background: linear-gradient(135deg, #e6e0f0, #f0f3f8);
                    color: #333;
                    line-height: 1.6;
                    overflow-x: hidden;
                    min-height: 100vh;
                }
                :root {
                    --btn-gradient: linear-gradient(to right, #4338ca, #db2777);
                    --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    --heading-color: #6B57E0;
                    --card-bg: #fff;
                }
                .container {
                    max-width: 1200px;
                    margin: 2rem auto;
                    padding: 0 1rem;
                }
                .add-blog-section {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    margin-bottom: 3rem;
                    padding: 1rem 0;
                }
                .add-blog-btn {
                    background: var(--btn-gradient);
                    color: white;
                    padding: 1.5rem 3rem;
                    font-size: 1.2rem;
                    font-weight: 600;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    box-shadow: var(--box-shadow);
                }
                .premium-modal {
                    display: none;
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem 2rem;
                    position: absolute;
                    top: calc(100% + 1rem);
                    z-index: 10;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                    flex-direction: column;
                    align-items: center;
                }
                .premium-modal.visible {
                    display: flex;
                }
                 .premium-modal p {
                    font-size: 1.2rem;
                    font-weight: 600;
                    color: var(--heading-color);
                    margin-bottom: 1rem;
                }
                .premium-modal .buy-btn {
                    background: var(--btn-gradient);
                    color: white;
                    padding: 0.5rem 1.5rem;
                    border: none;
                    border-radius: 20px;
                    font-weight: 500;
                    cursor: pointer;
                    text-decoration: none;
                }
                .premium-modal .close-btn {
                    background: #f0f0f0;
                    color: #555;
                    border: none;
                    padding: 0.5rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                }
                .premium-modal .button-container {
                    display: flex;
                    gap: 1rem;
                }
                .blog-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 2.5rem;
                }
                .blog-card {
                    background-color: var(--card-bg);
                    padding: 1.5rem;
                    border-radius: 15px;
                    box-shadow: var(--box-shadow);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                }
                .blog-card:hover {
                    transform: translateY(-5px);
                }
                .blog-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 1rem;
                    gap: 1rem;
                }
                .blog-header .user-avatar {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    overflow: hidden;
                    background-color: #f0f0f0;
                    border: 2px solid #ddd;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 1.5rem;
                    color: #ccc;
                }
                .blog-header .user-name {
                    font-weight: 600;
                }
                .blog-content h3 {
                    color: var(--heading-color);
                    margin-bottom: 0.5rem;
                }
                .blog-content p {
                    font-size: 0.9rem;
                    color: #555;
                    margin-bottom: 1rem;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    -webkit-line-clamp: 3;
                }
                .read-more-btn {
                    background: var(--btn-gradient);
                    color: white;
                    padding: 0.5rem 1.5rem;
                    border: none;
                    border-radius: 20px;
                    font-weight: 500;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                    margin-top: auto;
                    align-self: flex-start;
                }
                .blog-full-view {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                    display: none;
                    justify-content: center;
                    align-items: center;
                    z-index: 100;
                    padding: 2rem;
                    overflow-y: auto;
                }
                .blog-full-content {
                    background: var(--card-bg);
                    padding: 3rem;
                    border-radius: 20px;
                    box-shadow: var(--box-shadow);
                    max-width: 800px;
                    width: 100%;
                    position: relative;
                    animation: fadein 0.5s;
                }
                @keyframes fadein {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .close-full-view {
                    position: absolute;
                    top: 1.5rem;
                    right: 1.5rem;
                    font-size: 2rem;
                    cursor: pointer;
                    color: var(--heading-color);
                }
                .full-blog-header {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                .full-blog-header .user-avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                }
                .full-blog-header h2 {
                    font-size: 2rem;
                    color: var(--heading-color);
                }
                .full-blog-header p {
                    font-style: italic;
                    color: #777;
                }
                .full-blog-content-text {
                    line-height: 1.8;
                }
            `}</style>
        </div>
    );
};

// The export must be a default export to match your other files
export default Blog;