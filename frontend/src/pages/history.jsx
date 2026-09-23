import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { IconButton } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import withAuth from "../utils/withAuth";

function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(Array.isArray(history) ? history : []);
      } catch {
        //Implement snackbar
      }
    };
    fetchHistory();
  }, []);

  let formateDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };
  return (
    <div>
      <IconButton
        onClick={() => {
          routeTo("/home");
        }}
      >
        <HomeIcon />
      </IconButton>

      {meetings.length === 0 && <p>No meetings yet</p>}

      {meetings.map((e) => (
        <Card key={e._id} variant="outlined" sx={{ m: 2 }}>
          <CardContent>
            <Typography
              gutterBottom
              sx={{ color: "text.secondary", fontSize: 14 }}
            >
              Code: {e.meetingCode}
            </Typography>
            <Typography sx={{ color: "text.secondary", mb: 1.5 }}>
              Date: {formateDate(e.date)}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default withAuth(History);
