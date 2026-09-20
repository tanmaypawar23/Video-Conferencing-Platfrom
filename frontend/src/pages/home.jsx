import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import withAuth from "../utils/withAuth";
import "../App.css";
import { Button, IconButton, TextField } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext } from "../contexts/AuthContext";
import { useContext } from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const { addToUserHistory } = useContext(AuthContext);

  let handleJoinVideoCall = async () => {
    const code = meetingCode.trim();

    if (code === "") {
      setShowAlert(true);
      return;
    }

    setShowAlert(false);

    try {
      await addToUserHistory(code);
    } catch (e) {
      console.log("Could not save history", e);
    }

    navigate(`/${code}`);
  };

  return (
    <>
      <div className="navBar">
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2>Meetora</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <IconButton
            onClick={() => {
              navigate("/history");
            }}
          >
            <RestoreIcon />
          </IconButton>
          <p>history</p>
          <Button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/auth");
            }}
            variant="outlined"
          >
            LogOut
          </Button>
        </div>
      </div>

      <Snackbar
        open={showAlert}
        autoHideDuration={3000}
        onClose={() => setShowAlert(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          variant="filled"
          severity="warning"
          onClose={() => setShowAlert(false)}
          sx={{ width: "100%" }}
        >
          Please enter a meeting code first!
        </Alert>
      </Snackbar>

      <div className="meetContainer">
        <div className="leftPanel">
          <div>
            <h2>Providing Quality Video Call</h2>
            <div style={{ display: "flex", gap: "10px" }}>
              <TextField
                onChange={(e) => setMeetingCode(e.target.value)}
                id="outlined-basic"
                label="Meeeting Code"
                variant="outlined"
              ></TextField>
              <Button onClick={handleJoinVideoCall} variant="contained">
                Join
              </Button>
            </div>
          </div>
        </div>
        <div className="rightPanel">
          <img srcSet="/logo5.png" alt="" />
        </div>
      </div>
    </>
  );
}

export default withAuth(HomeComponent);
