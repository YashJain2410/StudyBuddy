// import React, { useEffect, useState } from "react";

// import ReportNov11 from "../assets/OpenCV_Report_11-Nov-2025.pdf";
// import ReportNov06 from "../assets/OpenCV_Report_06-Nov-2025.pdf";
// import ReportMonthly from "../assets/OpenCV_Monthly_Report.pdf";
// import ReportSummary from "../assets/OpenCV_Summary_Report.pdf";

// // ⭐ NEW PDF YOU UPLOADED
// import ReportChatSession from "../assets/StudyBuddy1.pdf";

// const Analytics = () => {
//   const [pdfReports, setPdfReports] = useState([]);

//   useEffect(() => {
//     setPdfReports([
//       {
//         name: "OpenCV_Report_11-Nov-2025.pdf",
//         url: ReportNov11,
//         date: "11 Nov 2025",
//         size: "342 KB",
//         focusScore: "74.4",
//       },
//       {
//         name: "OpenCV_Report_06-Nov-2025.pdf",
//         url: ReportNov06,
//         date: "06 Nov 2025",
//         size: "290 KB",
//         focusScore: "36.5",
//       },
//       {
//         name: "OpenCV_Monthly_Report.pdf",
//         url: ReportMonthly,
//         date: "Monthly Summary",
//         size: "512 KB",
//         focusScore: "75.0",
//       },
//       {
//         name: "OpenCV_Summary_Report.pdf",
//         url: ReportSummary,
//         date: "Overall Summary",
//         size: "410 KB",
//         focusScore: "74.4",
//       },

//       // ⭐ NEW PDF (WITHOUT focusScore)
//       {
//         name: "Chat_Session_Report.pdf",
//         url: ReportChatSession,
//         date: "13 Nov 2025",
//         size: "480 KB",
//         session: "Chat Activity Session Report",
//       },
//     ]);
//   }, []);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 text-gray-900 p-10 relative overflow-hidden">

//       {/* Floating Stars Background */}
//       <div className="absolute inset-0 pointer-events-none">
//         {[...Array(35)].map((_, i) => (
//           <div
//             key={i}
//             className="absolute w-1 h-1 bg-white rounded-full opacity-70"
//             style={{
//               top: `${Math.random() * 100}%`,
//               left: `${Math.random() * 100}%`,
//               animation: `blink 2s ease-in-out ${Math.random()}s infinite`
//             }}
//           />
//         ))}
//       </div>

//       <h1 className="text-5xl font-bold mb-10 text-center bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-lg">
//         📄 Analytics
//       </h1>

//       {/* Cards Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
//         {pdfReports.map((pdf, index) => (
//           <div
//             key={index}
//             className="bg-white/70 backdrop-blur-xl shadow-xl border border-white/40 rounded-2xl p-6 hover:shadow-2xl transition-all hover:-translate-y-1"
//           >
//             <h2 className="text-xl font-semibold mb-2 text-gray-900">{pdf.name}</h2>
//             <p className="text-sm text-gray-600">📅 Date: {pdf.date}</p>
//             <p className="text-sm text-gray-600">📁 Size: {pdf.size}</p>

//             {/* SAFE CONDITIONAL UI */}
//             {pdf.focusScore ? (
//               <p className="text-sm text-gray-600 mb-4">
//                 🎯 Focus Score: <b className="text-purple-700">{pdf.focusScore}</b>
//               </p>
//             ) : (
//               <p className="text-sm text-gray-600 mb-4">
//                 📌 {pdf.session}
//               </p>
//             )}

//             <a
//               href={pdf.url}
//               target="_blank"
//               rel="noreferrer"
//               className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition"
//             >
//               View PDF
//             </a>
//           </div>
//         ))}
//       </div>

//       {/* Small Glow Animation */}
//       <style>{`
//         @keyframes blink {
//           0%, 100% { opacity: 0.3; }
//           50% { opacity: 1; }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default Analytics;


import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

const Analytics = () => {
  const [pdfReports, setPdfReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await apiFetch("/api/reports/my"); // 🔥 simple call

        const data = await res.json();

        if (data.success) {
          setPdfReports(data.reports);
        }
      } catch (err) {
        console.error("❌ Failed to load reports", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 text-gray-900 p-10 relative overflow-hidden">

      {/* Floating stars */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(35)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-70"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `blink 2s ease-in-out ${Math.random()}s infinite`
            }}
          />
        ))}
      </div>

      <h1 className="text-5xl font-bold mb-10 text-center bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-lg">
        📄 Analytics
      </h1>

      {/* Loading */}
      {loading && (
        <p className="text-center text-lg text-gray-600">
          Loading reports...
        </p>
      )}

      {/* Empty */}
      {!loading && pdfReports.length === 0 && (
        <p className="text-center text-lg text-gray-600">
          No reports generated yet.
        </p>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {pdfReports.map((pdf) => (
          <div
            key={pdf._id}
            className="bg-white/70 backdrop-blur-xl shadow-xl border border-white/40 rounded-2xl p-6 hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            <h2 className="text-xl font-semibold mb-2 text-gray-900">
              {pdf.title || "StudyBuddy Report"}
            </h2>

            <p className="text-sm text-gray-600">
              📅 Date: {new Date(pdf.createdAt).toDateString()}
            </p>

            <p className="text-sm text-gray-600 mb-4">
              📁 Format: PDF
            </p>
<a
  href={pdf.fileUrl}   // ✅ BAS ITNA
  target="_blank"
  rel="noreferrer"
  className="inline-block px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition"
>
  View PDF
</a>

          </div>
        ))}
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Analytics;
