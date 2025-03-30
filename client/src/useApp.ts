// import { use, useEffect, useRef, useState } from "react";
// import { SocketHandler } from "./services/Sockets";
// import { EventEmitter } from "./services/EventEmitter";
// import { Device } from "mediasoup-client";
// import {
//     Consumer,
//     DtlsParameters,
//     IceCandidate,
//     IceParameters,
//     Transport,
// } from "mediasoup-client/types";
// import { Socket } from "socket.io-client";
// import { EVENT_NAMES } from "./services/Sockets/constants";

// export const useApp = () => {
//     const localStreamRef = useRef<HTMLVideoElement>(null);
//     const remoteStreamRef = useRef<HTMLVideoElement>(null);

//     const [params, setParams] = useState({
//         encoding: [
//             { rid: "r0", maxBitrate: 100000, scalabilityMode: "S1T3" }, // Lowest quality layer
//             { rid: "r1", maxBitrate: 300000, scalabilityMode: "S1T3" }, // Middle quality layer
//             { rid: "r2", maxBitrate: 900000, scalabilityMode: "S1T3" }, // Highest quality layer
//         ],
//         codecOptions: { videoGoogleStartBitrate: 1000 }, // Initial bitrate
//     });

//     const [device, setDevice] = useState<Device | null>(null); // mediasoup Device
//     const [rtpCapabilities, setRtpCapabilities] = useState<any>(null); // RTP Capabilities for the device
//     const [producerTransport, setProducerTransport] =
//         useState<Transport | null>(null); // Transport for sending media
//     const [consumerTransport, setConsumerTransport] =
//         useState<Transport | null>(null); // Transport for receiving media
//     const [socket, setSocket] = useState<Socket>();

//     useEffect(() => {
//         const socket = SocketHandler.getSocket();
//         setSocket(socket);

//         socket.emit(EVENT_NAMES.JOIN_ROOM, { roomId: 1 });
//         startCamera();

//         EventEmitter.listen(EVENT_NAMES.ROUTER_CAPABILITIES, (data: any) => {
//             setRtpCapabilities(data);
//         });

//         return () => {
//             // socket?.disconnect();
//         };
//     }, []);

//     useEffect(() => {
//         if (rtpCapabilities) {
//             createDevice();
//         }
//     }, [rtpCapabilities]);

//     useEffect(() => {
//         //@ts-ignore
//         if (params?.track) {
//             connectSendTransport();
//         }
//     }, [params]);

//     const startCamera = async () => {
//         try {
//             const videoStream = await navigator.mediaDevices?.getUserMedia({
//                 video: true,
//             });
//             if (localStreamRef?.current) {
//                 localStreamRef.current.srcObject = videoStream;
//                 const track = videoStream?.getVideoTracks()[0];
//                 setParams((current) => ({ ...current, track }));
//             }
//         } catch (error) {}
//     };

//     const createDevice = async () => {
//         try {
//             const newDevice = new Device();

//             await newDevice.load({ routerRtpCapabilities: rtpCapabilities });

//             setDevice(newDevice);
//             createSendTransport();
//             createRecvTransport();
//         } catch (error: any) {
//             console.log(error);
//             if (error.name === "UnsupportedError") {
//                 console.error("Browser not supported");
//             }
//         }
//     };

//     const createSendTransport = async () => {
//         socket?.emit(
//             EVENT_NAMES.CREATE_TRANSPORT,
//             { sender: true },
//             async (params: {
//                 id: string;
//                 iceParameters: IceParameters;
//                 iceCandidates: IceCandidate[];
//                 dtlsParameters: DtlsParameters;
//                 error?: unknown;
//             }) => {
//                 const transport = device?.createSendTransport(params);
//                 setProducerTransport(transport!);

//                 transport?.on(
//                     "connect",
//                     async (
//                         { dtlsParameters }: any,
//                         callback: any,
//                         errback: any
//                     ) => {
//                         try {
//                             console.log(
//                                 "----------> producer transport has connected"
//                             );
//                             socket.emit(
//                                 EVENT_NAMES.CONNECT_PRODUCER_TRANSPORT,
//                                 {
//                                     dtlsParameters,
//                                 }
//                             );
//                             callback();
//                         } catch (error) {
//                             errback(error);
//                         }
//                     }
//                 );

//                 transport?.on(
//                     "produce",
//                     async (parameters: any, callback: any, errback: any) => {
//                         try {
//                             const { kind, rtpParameters } = parameters;

//                             console.log("----------> transport-produce");

//                             socket.emit(
//                                 EVENT_NAMES.TRANSPORT_PRODUCE,
//                                 { kind, rtpParameters },
//                                 ({ id }: { id: any }) => {
//                                     callback(id);
//                                 }
//                             );
//                         } catch (error) {
//                             errback(error);
//                         }
//                     }
//                 );
//             }
//         );
//     };

//     const connectSendTransport = async () => {
//         const localProducer = await producerTransport?.produce(params);
//         localProducer?.on("trackended", () => {
//             console.log("trackended");
//         });
//         localProducer?.on("transportclose", () => {
//             console.log("transportclose");
//         });
//     };

//     const createRecvTransport = async () => {
//         // Requesting the server to create a receive transport
//         socket?.emit(
//             EVENT_NAMES.CREATE_TRANSPORT,
//             { sender: false },
//             (params: any) => {
//                 // Creating a receive transport on the client-side using the server-provided parameters
//                 let transport = device?.createRecvTransport(params);
//                 setConsumerTransport(transport!);

//                 /**
//                  * This event is triggered when "consumerTransport.consume" is called
//                  * for the first time on the client-side.
//                  * */
//                 transport?.on(
//                     "connect",
//                     async (
//                         { dtlsParameters }: any,
//                         callback: any,
//                         errback: any
//                     ) => {
//                         try {
//                             // Notifying the server to connect the receive transport with the provided DTLS parameters
//                             await socket.emit(
//                                 EVENT_NAMES.CONNECT_CONSUMER_TRANSPORT,
//                                 {
//                                     dtlsParameters,
//                                 }
//                             );
//                             console.log(
//                                 "----------> consumer transport has connected"
//                             );
//                             callback();
//                         } catch (error) {
//                             errback(error);
//                         }
//                     }
//                 );
//             }
//         );
//     };

//     const connectRecvTransport = async () => {
//         // Requesting the server to start consuming media
//         await socket?.emit(
//             EVENT_NAMES.CONSUME_MEDIA,
//             { rtpCapabilities: device?.rtpCapabilities },
//             async ({ params }: any) => {
//                 if (params.error) {
//                     console.log(params.error);
//                     return;
//                 }

//                 // Consuming media using the receive transport
//                 let consumer = await consumerTransport?.consume({
//                     id: params.id,
//                     producerId: params.producerId,
//                     kind: params.kind,
//                     rtpParameters: params.rtpParameters,
//                 });

//                 // Accessing the media track from the consumer
//                 const { track } = consumer!;
//                 console.log("************** track", track);

//                 // Attaching the media track to the remote video element for playback
//                 if (remoteStreamRef?.current) {
//                     remoteStreamRef.current.srcObject = new MediaStream([
//                         track,
//                     ]);
//                 }

//                 // Notifying the server to resume media consumption
//                 socket.emit("resumePausedConsumer", () => {});
//                 console.log("----------> consumer transport has resumed");
//             }
//         );
//     };

//     return {
//         localStreamRef,
//         remoteStreamRef,
//         createDevice,
//         createSendTransport,
//         connectSendTransport,
//         createRecvTransport,
//         connectRecvTransport,
//     };
// };
