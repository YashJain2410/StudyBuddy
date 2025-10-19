import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const initialBlogPosts = [
    {
        id: 1,
        title: "Mastering Pomodoro!",
        author: "Ananya Sharma",
        image: "",
        excerpt: "Learn how to optimize and elevate your study-sessions with the Pomodoro technique. It's a game-changer for focus and productivity. I've been using this for a while and it really helps me to study.",
        fullContent: "The Pomodoro Technique is a time management method developed by Francesco Cirillo in the late 1980s. The technique uses a timer to break down work into intervals, traditionally 25 minutes in length, separated by short breaks. The name Pomodoro comes from the Italian word for tomato, after the tomato-shaped kitchen timer Cirillo used as a university student. The core principle is to work in focused, uninterrupted sprints, which helps to combat procrastination and maintain a high level of concentration. After four 'pomodoros,' you take a longer break. It's an incredibly effective way to manage your time and tackle complex tasks."
    },
    {
        id: 2,
        title: "Effective Study Habits",
        author: "Rajesh Kumar",
        image: "",
        excerpt: "Setting up a solid study routine can be tough, but with these simple tips, you'll be on your way to success. Remember, consistency is key!",
        fullContent: "Developing effective study habits is crucial for academic success. One of the most important habits is to create a consistent study schedule. By dedicating specific times each day or week to your studies, you build a routine that your brain can follow. Another key habit is active recall—instead of just re-reading your notes, try to remember the information without looking at them. This strengthens your memory and helps you identify areas you need to review more. Finally, don't forget the importance of breaks. Short breaks can prevent burnout and improve your focus when you return to your work."
    },
    {
        id: 3,
        title: "Exam Prep Hacks",
        author: "Rishabh Singh",
        image: "",
        excerpt: "Ace your exams with these simple, yet powerful tips. From creating a study plan to managing stress, you'll be well-prepared.",
        fullContent: "Preparing for exams can be stressful, but with the right approach, you can feel confident and ready. Start by creating a detailed study plan that breaks down your material into manageable chunks. Use mind maps or flashcards to help you visualize complex topics and concepts. Don't pull all-nighters; get plenty of sleep as it's essential for memory consolidation. Finally, practice with past papers. This not only helps you understand the format of the exam but also allows you to manage your time effectively during the test. Stay calm and trust the process!"
    },
    {
        id: 4,
        title: "Coding for Beginners",
        author: "Anjilesh Sharma",
        image: "",
        excerpt: "Start your coding journey with these easy-to-follow steps. It’s not as hard as you think, and with practice, you'll be a pro in no time.",
        fullContent: "Starting to code can seem intimidating, but the journey is exciting and rewarding. Begin with a high-level language like Python, as its syntax is easy to read and understand. Don't get stuck on one concept; start building small projects as early as possible. This practical application will help you learn much faster than just reading theory. Join online communities or forums where you can ask questions and learn from others' experiences. And remember, every programmer, even the most experienced ones, started with 'Hello, World!'."
    },
    {
        id: 5,
        title: "Healthy Eating for a Healthy Mind",
        author: "Priya Das",
        image: "",
        excerpt: "Eating healthy isn't just for your body—it's vital for your brain too! Learn which foods can boost your memory and concentration.",
        fullContent: "What you eat can have a huge impact on your ability to focus and remember information. Foods rich in Omega-3 fatty acids, like salmon and walnuts, are great for brain health. Berries and dark leafy greens are packed with antioxidants that can help protect your brain from stress. Make sure to stay hydrated as well, as even mild dehydration can affect your cognitive performance. A well-balanced diet is the foundation for a sharp and healthy mind."
    },
    {
        id: 6,
        title: "Staying Organized with Digital Tools",
        author: "Liam Chen",
        image: "",
        excerpt: "Tired of a cluttered desk and a messy schedule? Explore a range of digital tools and apps that can help you stay organized effortlessly.",
        fullContent: "In today's digital world, staying organized has never been easier. Apps like Trello and Asana are fantastic for managing tasks and projects. For note-taking, tools like Evernote and OneNote let you keep all your notes, ideas, and research in one place. Using a digital calendar like Google Calendar or Outlook can help you schedule your study sessions, classes, and social events, ensuring you never miss a deadline. By leveraging these tools, you can streamline your life and reduce stress."
    },
    {
        id: 7,
        title: "The Art of Stress Management",
        author: "Aisha Chetry",
        image: "",
        excerpt: "Exams and deadlines can be stressful. Learn simple breathing exercises and mindfulness techniques to keep calm and focused.",
        fullContent: "Managing stress is a key skill for any student. When you feel overwhelmed, taking a few minutes for deep breathing exercises can calm your nervous system. Mindfulness and meditation can help you stay present and reduce anxiety. It's also important to get regular physical activity, as exercise is a powerful stress-reliever. Don't be afraid to take a break and do something you enjoy, whether it's listening to music, talking to a friend, or going for a walk. Prioritizing your mental health is just as important as academic preparation."
    },
    {
        id: 8,
        title: "Effective Time Blocking",
        author: "Eshan Cher",
        image: "",
        excerpt: "Struggling to find enough time in the day? Time blocking is a simple method that can help you maximize productivity and achieve your goals.",
        fullContent: "Time blocking is a time management method that involves planning out every moment of your day in advance and assigning specific tasks to specific time slots. By scheduling not just your classes and appointments, but also your study sessions, breaks, and even leisure activities, you create a structured plan for your day. This technique helps you to focus on one task at a time, preventing multitasking and improving your concentration. It also gives you a clear sense of progress and accomplishment as you check off each block of time."
    },
    {
        id: 9,
        title: "Finding Your Passion in Learning",
        author: "Sara Khan",
        image: "",
        excerpt: "Sometimes, studying feels like a chore. Discover how to connect with your subjects on a deeper level and ignite your passion for learning.",
        fullContent: "Finding a passion for what you're studying can make a world of difference. Try to connect what you're learning to your personal interests or career goals. For example, if you're studying history, find a documentary or a historical novel that brings the era to life. If you're studying science, look for real-world applications of the concepts you're learning. Engaging with the material in a personal way makes it more meaningful and enjoyable. When you're passionate, studying no longer feels like a task but a journey of discovery."
    }
];

// The component name MUST be capitalized (PascalCase)
const Blog = () => {
    const [posts, setPosts] = useState(initialBlogPosts);
    const [isPremiumModalVisible, setPremiumModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);

    return (
        <div className="blog-page-container">
            <header className="navbar">
                <Link to="/" className="logo">StudyBuddy</Link>
                <nav className="nav-links">
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/">About Us</Link>
                    <Link to="/contact">Contact Us</Link>
                </nav>
                <div className="auth-buttons">
                    <Link to="/login"><button className="login-btn">Login</button></Link>
                    <Link to="/register"><button className="signup-btn">Sign Up</button></Link>
                </div>
            </header>

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
                .navbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem 5%;
                    background: var(--btn-gradient);
                    color: white;
                    box-shadow: var(--box-shadow);
                }
                .navbar .logo, .navbar a {
                    color: white;
                    text-decoration: none;
                }
                .navbar .logo {
                    font-size: 1.8rem;
                    font-weight: 700;
                }
                .navbar .nav-links a {
                    margin-left: 2rem;
                    font-weight: 500;
                }
                .navbar .auth-buttons button {
                    padding: 0.6rem 1.5rem;
                    border: none;
                    border-radius: 25px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .navbar .login-btn {
                    background-color: transparent;
                    border: 2px solid white;
                    margin-right: 1rem;
                }
                .navbar .signup-btn {
                    background-color: white;
                    color: var(--heading-color);
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
                 @media (max-width: 768px) {
                    .navbar {
                        flex-direction: column;
                        align-items: flex-start;
                        padding: 1.5rem;
                    }

                    .navbar .nav-links {
                        display: none;
                    }

                    .navbar .auth-buttons {
                        margin-top: 1rem;
                    }
                }
            `}</style>
        </div>
    );
};

// The export must be a default export to match your other files
export default Blog;