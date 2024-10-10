
import JsSIP from "jssip";
import { useMitt } from "@/hooks/utils";
import { ElMessage, ElNotification, ElButton } from "element-plus";
import {
  SIP_OUT_ACCEPETED,
  SIP_ENDED,
  VIDEO_CALL,
  AUDIO_CALL,

} from "@/constants/eventbus";
import { useTimer } from "@/hooks/useTimer";
import { useGlobalStore } from "@/store/global";

const emitter = useMitt();

JsSIP.C.SESSION_EXPIRES = 120;
JsSIP.C.MIN_SESSION_EXPIRES = 120;

export default class SIPManager {
  constructor() {
    this.userAgent = null;
    this.outgoingSession = null;
    this.incomingSession = null;
    this.currentSession = null;
    this.localStream = new MediaStream();
    this.remote_video_ele = null;
    this.audio_ele = null;
    this.IP = "";
    this.FSSURI = "";
    this.isVideoCall = false;
  }

  registerNum(ext, FSS, localIp, registerCallbacks) {
    // 分机号注册 格式 sip: + 分机号码 + @ + FS注册地址
    this.IP = localIp;
    this.FSSURI = FSS;
    let sip_uri_ = `sip:${ext}@${FSS}:5060;transport=wss`;
    // FS密码
    let sip_password_ = ext;
    // Fs的 ws协议地址
    let ws_uri_ = `wss://${FSS}:7443`;

    const { registrationFailed, registered, registrationExpiring } =
      registerCallbacks;
    console.info(
      "get input info: sip_uri = ",
      sip_uri_,
      " sip_password = ",
      sip_password_,
      " ws_uri = ",
      ws_uri_
    );
    let socket = new JsSIP.WebSocketInterface(ws_uri_);
    let configuration = {
      sockets: [socket],
      uri: sip_uri_,
      password: sip_password_,
      outbound_proxy_set: ws_uri_,
      contact_uri: `sip:${ext}@${localIp}:20455;transport=wss`,
      session_timers: false, //是否开启会话计时器
      register: true, // 自动注册
      register_expires: 3600, //多长时间重连一次 14000s==3.8888889h
    };
    this.userAgent = new JsSIP.UA(configuration);
    // 注册成功
    this.userAgent.on("registered", registered);

    // 注册失败
    this.userAgent.on("registrationFailed", registrationFailed);

    // 注册超时
    this.userAgent.on("registrationExpiring", registrationExpiring);

    //  必须使用 箭头函数不然   踩坑：===》this 指向问题
    this.userAgent.on("newRTCSession", (data) => {
      if (this.currentSession === null) {
        this.currentSession = data.session;
      }
      // 通话呼入
      if (data.originator == "remote") {
        this.incomingSession = data.session;
        this.sipEventBind(data);
      } else {
        // 呼出
        this.outgoingSession = data.session;
        this.outgoingSession.connection.addEventListener("track", (event) => {
          emitter.emit(SIP_OUT_ACCEPETED, event);
        });
      }
      
      // 在将远程SDP传递到RTC引擎之前以及在发送本地SDP之前激发。此事件提供了修改传入和传出SDP的机制。
      this.currentSession.on("sdp", function (data) {
        console.info("onSDP, type - ", data.type, " sdp - ", data.sdp);
      });
    });

    this.userAgent.on("newMessage", function (data) {
      if (data.originator == "local") {
        console.info("onNewMessage , OutgoingRequest - ", data.request);
      } else {
        console.info("onNewMessage , IncomingRequest - ", data.request);
      }
    });
    this.userAgent.start();
  }

  // 被叫
  sipEventBind(remotedata) {
    const globalStore = useGlobalStore();
    const { session } = remotedata;
    const _isVideoCall = remotedata.request.body.includes("m=video");
    this.isVideoCall = _isVideoCall;
    const num = remotedata.request.from["_display_name"];
    if (_isVideoCall) {
      globalStore.$patch({
        callNum: num,
        isRinging: true,
      });
      emitter.emit(VIDEO_CALL);
    } else {
      globalStore.$patch({
        callNum: num,
        isRinging: true,
      });
      emitter.emit(AUDIO_CALL);
    }
    // 在确认呼叫时激发（接收/发送ACK）。
    session.on("confirmed", () => {
      if (!_isVideoCall) {
        // 语音呼叫
        const audioElement = document.createElement("audio");
        audioElement.autoplay = true;
        const stream = new MediaStream();
        const receivers = session.connection.getReceivers();
        if (receivers)
          receivers.forEach((receiver) => stream.addTrack(receiver.track));
          audioElement.srcObject = stream;
        // 最后都要播放
        console.log("=======>",audioElement,stream);
        audioElement.play()
      }
    });
    // console.log("来电提示");
    session.on("progress", () => {
      console.log("call is in progress");
    });
    // 在接受呼叫时激发（接收/发送2XX）。
    session.on("accepted", () => {
      console.info("接听成功");
    });
    session.on("failed", function (e) {
      console.log("来电通话失败");
      emitter.emit(SIP_ENDED);
      this.currentSession = null;
      useTimer().clear();
    });

    session.on("ended", function (e) {
      emitter.emit(SIP_ENDED);
      this.currentSession = null;
      useTimer().clear();
    });

    session.on("peerconnection", () => {
      if(_isVideoCall){
        const videoElement = document.getElementById('remoteVideo')
        videoElement.autoplay = true;
        const stream = new MediaStream();
        const receivers = session.connection.getReceivers();
        if (receivers){  
          receivers.forEach((receiver) => stream.addTrack(receiver.track))
          console.log("=======>",videoElement,stream);
          videoElement.srcObject = stream;
          // 最后都要播放
          videoElement.play();
        }
      }
    });
  }

  // 主叫
  call(sip_phone_number_) {
    // Register callbacks to desired call events
    try {
      let eventHandlers = {
        progress: function (e) {
          console.log("call is in progress");
        },
        failed: function (e) {
          console.log("call failed: ", e);
          this.currentSession = null;
          useTimer().clear();
        },
        ended: function (e) {
          console.log("call ended with cause: " + e);
          ElMessage({
            type: "error",
            message: "对方已挂断",
          });
          emitter.emit(SIP_ENDED);
          this.currentSession = null;
          useTimer().clear();
        },
        confirmed: function (e) {
          console.log("call confirmed", e);
        },
      };

      let options = {
        eventHandlers: eventHandlers,
        mediaConstraints: {
          audio: true,
          video: true,
        },
        extraHeaders: ["X-Foo: foo", "X-Bar: bar"], // INVITE请求。
        pcConfig: {
          iceServers: [
            {
              urls: ["stun:stun1.l.google.com:19302"],
            },
          ],
        },
        rtcOfferConstraints: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        },
      };
      let sip_uri_ = `sip:"${sip_phone_number_}"@${this.FSSURI}:5060`;
      this.outgoingSession = this.userAgent.call(sip_uri_, options);
    } catch (err) {
      console.error("呼叫失败：", err);
    }
  }


  reg() {
    console.log("register----------->");
    this.userAgent.register();
  }

  // 取消注册
  unReg() {
    console.log("unregister----------->");
    this.userAgent.unregister(true);
  }

  // 静音
  Mute() {
    let options = {
      audio: true,
      video: true,
    };
    this.currentSession.mute(options);
  }

  // 挂断
  hangup() {
    this.userAgent.terminateSessions();
    this.currentSession = null;
    useTimer().clear();
  }

  unMute() {
    console.log("====currentSession", this.currentSession);
    let options = {
      audio: true,
      video: true,
    };
    this.currentSession.unmute(options);
  }

  Hold() {
    let options = {
      useUpdate: false,
    };
    let done = function () {
      console.log("保持中");
    };
    this.currentSession.hold(options, done);
  }

  //取消保持的方法
  unHold() {
    let options = {
      useUpdate: false,
    };
    let done = function () {
      console.log("取消保持");
    };
    this.currentSession.unhold(options, done);
  }

  answer() {
    let options = {
      mediaConstraints: {
        audio: true,
        video: this.isVideoCall,
        pcConfig: {
          iceServers: [
            {
              urls: "stun:stun.l.google.com:19302",
            }
          ],
        },
      },
    };
    this.incomingSession.answer(options);
  }
}
