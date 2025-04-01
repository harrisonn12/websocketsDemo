// MouseTracker.jsx
import React, { useState, useEffect } from "react";

const MouseTracker = () => {
  // positions: { [userId]: { x, y } }
  const [positions, setPositions] = useState({});
  const [ws, setWs] = useState(null);

  // Assign a random unique userId when the component mounts
  const [userId] = useState(() => Math.random().toString(36).substring(2, 15));

  useEffect(() => {
    // Create WebSocket connection.
    const socket = new WebSocket(`ws://localhost:6789/`);

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Expected message format: { user: string: x: number, y: number }
        //
        const newPositions = (prev) => ({
          ...prev,
          [data.user]: { x: data.x, y: data.y },
        });
        setPositions(newPositions);
      } catch (err) {
        console.error("Error parsing JSON", err);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    setWs(socket);

    // Cleanup: close connection on unmount
    return () => {
      socket.close();
    };
  }, []);

  // Listen for mouse move events and send updates
  useEffect(() => {
    const handleMouseMove = (e) => {
      const data = {
        user: userId,
        x: e.clientX,
        y: e.clientY - 100,
      };

      // Update our local state immediately for a smooth experience
      setPositions((prev) => ({
        ...prev,
        [userId]: { x: e.clientX, y: e.clientY },
      }));

      // Send the mouse position to the server as JSON
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [ws, userId]);

  return (
    <div>
      <h1>Mouse Tracker</h1>
      <div style={{ position: "relative", width: "100%", height: "100vh" }}>
        {Object.entries(positions).map(([id, pos]) => (
          <div
            key={id}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              width: "10px",
              height: "10px",
              backgroundColor: id === userId ? "red" : "blue",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
            title={id === userId ? "You" : id}
          />
        ))}
      </div>
    </div>
  );
};

export default MouseTracker;
