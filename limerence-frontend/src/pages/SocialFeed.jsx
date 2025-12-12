import React from "react";

const ACTIVITIES = [
  { id: 1, user: "Sarah J.", action: "finished reading", book: "It Ends with Us", time: "2h ago", avatar: "" },
  { id: 2, user: "Mike R.", action: "rated 5 stars", book: "The Love Hypothesis", time: "4h ago", avatar: "" },
  { id: 3, user: "Emily W.", action: "started reading", book: "Book Lovers", time: "5h ago", avatar: "" },
  { id: 4, user: "Jessica T.", action: "commented on", book: "Verity", time: "1d ago", avatar: "" },
];

export default function SocialFeed() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Community Feed</h1>
        
        <div className="space-y-4">
          {ACTIVITIES.map((activity) => (
            <div key={activity.id} className="bg-white p-4 rounded-xl shadow-sm flex gap-4 items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {activity.user[0]}
              </div>
              <div className="flex-1">
                <p className="text-gray-800">
                  <span className="font-bold">{activity.user}</span> {activity.action}{" "}
                  <span className="font-bold text-primary">{activity.book}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center">
            <button className="text-primary font-medium hover:underline">Load More</button>
        </div>
      </div>
    </div>
  );
}
