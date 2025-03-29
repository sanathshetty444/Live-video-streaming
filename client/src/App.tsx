import { useApp } from "./useApp";
import "./index.css";

function App() {
    const {
        localStreamRef,
        remoteStreamRef,
        connectSendTransport,
        connectRecvTransport,
        createDevice,
        createRecvTransport,
        createSendTransport,
    } = useApp();
    return (
        <>
            <video ref={localStreamRef} id="localvideo" autoPlay playsInline />
            <video
                ref={remoteStreamRef}
                id="remotevideo"
                autoPlay
                playsInline
            />
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                }}
            >
                {/* <button onClick={getRouterRtpCapabilities}>
                    Get Router RTP Capabilities
                </button> */}
                <button onClick={createDevice}>Create Device</button>
                <button onClick={createSendTransport}>
                    Create send transport
                </button>
                <button onClick={connectSendTransport}>
                    Connect send transport and produce
                </button>
                <button onClick={createRecvTransport}>
                    Create recv transport
                </button>
                <button onClick={connectRecvTransport}>
                    Connect recv transport and consume
                </button>
            </div>
        </>
    );
}

export default App;
