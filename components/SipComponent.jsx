import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import JsSIP from 'jssip';

const SIPManager = () => {
  const [userAgent, setUserAgent] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
    const socket = new JsSIP.WebSocketInterface('wss://your-sip-server.com');
    const configuration = {
      sockets: [socket],
      uri: 'sip:your-username@your-sip-server.com',
      password: 'your-password',
    };

    const ua = new JsSIP.UA(configuration);

    ua.on('registered', () => {
      console.log('Registered to SIP server');
    });

    ua.on('registrationFailed', (error) => {
      console.error('Registration failed:', error);
    });

    ua.on('newRTCSession', (session) => {
      if (session.originator === 'remote') {
        setIncomingCall(session);
      } else {
        setIsCalling(true);
      }
    });

    setUserAgent(ua);
  }, []);

  const makeCall = () => {
    if (userAgent) {
      const session = userAgent.call('sip:destination-username@your-sip-server.com');
      setIsCalling(true);
    }
  };

  const answerCall = () => {
    if (incomingCall) {
      incomingCall.answer();
      setIsCalling(true);
    }
  };

  const hangUp = () => {
    if (isCalling) {
      userAgent.bye();
      setIsCalling(false);
    }
  };

  return (
    <View>
      {isCalling? (
        <Text>Calling...</Text>
      ) : (
        <TouchableOpacity onPress={makeCall}>
          <Text>Make Call</Text>
        </TouchableOpacity>
      )}
      {incomingCall && (
        <TouchableOpacity onPress={answerCall}>
          <Text>Answer Call</Text>
        </TouchableOpacity>
      )}
      {isCalling && (
        <TouchableOpacity onPress={hangUp}>
          <Text>Hang Up</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SIPManager;
