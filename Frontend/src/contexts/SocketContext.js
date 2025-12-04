import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, token } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (user && token) {
      // Prefer explicit API URL; otherwise, infer local dev URL if running on localhost:3000
      // Always use localhost:5000 for local development (both 3000 and 3001)
      const inferredUrl = (typeof window !== 'undefined' && 
        (window.location.origin.includes('localhost:3000') || window.location.origin.includes('localhost:3001')))
        ? 'http://localhost:5000'
        : window.location.origin;
      const baseUrl = process.env.REACT_APP_API_URL || inferredUrl;

      console.log('Connecting to socket server at:', baseUrl);
      
      const newSocket = io(baseUrl, {
        auth: { token },
        transports: ['websocket', 'polling'], // Add polling as fallback
        timeout: 30000, // Increase timeout
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10, // Increase reconnection attempts
        forceNew: true // Force new connection
      });

      newSocket.on('connect', () => {
        console.log('Connected to server via WebSocket');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        console.error('Error message:', error.message);
        console.error('Error type:', error.type);
        console.error('Error description:', error.description);
        setConnected(false);
      });

      // Listen for vote cast updates
      newSocket.on('vote_cast', (data) => {
        console.log('Vote cast update:', data);
        // This will be used by components to update their state
      });

      // Listen for live results updates (for admins)
      newSocket.on('live_results_update', (data) => {
        console.log('Live results update:', data);
        // This will be used by the results page to update in real-time
      });

      // Listen for election status changes
      newSocket.on('election_status_changed', (data) => {
        console.log('Election status changed:', data);
        addNotification({
          type: 'info',
          title: 'Election Status Changed',
          message: `"${data.title}" is now ${data.newStatus}`,
          timestamp: data.timestamp
        });
      });

      // Listen for candidate approvals
      newSocket.on('candidate_approved', (data) => {
        console.log('Candidate approved:', data);
        addNotification({
          type: 'success',
          title: 'Candidate Approved',
          message: `Your candidacy for ${data.position} in "${data.electionTitle}" has been approved!`,
          timestamp: data.timestamp
        });
      });

      // Listen for new approved candidates
      newSocket.on('new_candidate_approved', (data) => {
        console.log('New candidate approved:', data);
        addNotification({
          type: 'info',
          title: 'New Candidate',
          message: `${data.candidateName} has been approved for ${data.position}`,
          timestamp: data.timestamp
        });
      });

      // Listen for turnout milestones
      newSocket.on('turnout_milestone', (data) => {
        console.log('Turnout milestone:', data);
        addNotification({
          type: 'success',
          title: 'Turnout Milestone!',
          message: `Election has reached ${data.milestone}% turnout! Current: ${data.currentTurnout}%`,
          timestamp: data.timestamp
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [user, token]);

  // Function to add notifications
  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep only 10 most recent

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  // Function to remove notifications
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Function to join election room
  const joinElection = (electionId) => {
    if (socket && connected) {
      console.log('Joining election room:', electionId);
      socket.emit('join_election', electionId);
    }
  };

  // Function to leave election room
  const leaveElection = (electionId) => {
    if (socket && connected) {
      console.log('Leaving election room:', electionId);
      socket.emit('leave_election', electionId);
    }
  };

  // Function to subscribe to live results (for admins)
  const subscribeLiveResults = (electionId) => {
    if (socket && connected && user?.role === 'admin') {
      console.log('Subscribing to live results:', electionId);
      socket.emit('subscribe_live_results', electionId);
    }
  };

  // Function to listen for specific events
  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  // Function to stop listening for specific events
  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const value = {
    socket,
    connected,
    notifications,
    joinElection,
    leaveElection,
    subscribeLiveResults,
    removeNotification,
    on,
    off
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};