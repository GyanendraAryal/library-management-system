import { useState } from "react";

function GoogleTabs() {
  const [activeTab, setActiveTab] = useState("all");
  return (
    <div className="container">
      <ul className="flex justify-evenly">
        <li
          onClick={() => setActiveTab("all")}
          className={`cursor-pointer px-3 text-black ${activeTab == "all" ? "text-underline text-red-600" : ""}`}
        >
          All
        </li>
        <li
          onClick={() => setActiveTab("images")}
          className={`cursor-pointer px-3 text-black ${activeTab == "images" ? "text-underline text-red-600" : ""}`}
        >
          Images
        </li>
        <li
          onClick={() => setActiveTab("videos")}
          className={`cursor-pointer px-3 text-black ${activeTab == "videos" ? "text-underline text-red-600" : ""}`}
        >
          Videos
        </li>
      </ul>
      {activeTab === "all" ? (
        <div className="all">
          <p>All</p>
        </div>
      ) : activeTab === "images" ? (
        <div className="images">
          <p>Images</p>
        </div>
      ) : (
        <div className="videos">
          <p>Videos</p>
        </div>
      )}
    </div>
  );
}

export default GoogleTabs;
