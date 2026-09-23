import "../App.css";
import { Link, useNavigate } from "react-router-dom";

export default function LandingPage() {
  const router = useNavigate();
  return (
    <div className="landingPageConatiner">
      <nav>
        <div className="navHeader">
          <img src="./logo8.png" style={{ width: "5%" }}></img>
          <h2>NexMeet</h2>
        </div>
        <div className="navlist">
          <p
            onClick={() => {
              router(`/meet/${Math.random().toString(36).slice(2, 10)}`);
            }}
          >
            Join as Guest
          </p>
          <p
            onClick={() => {
              router("/auth");
            }}
          >
            Register
          </p>
          <div role="button">
            <p
              onClick={() => {
                router("/auth");
              }}
            >
              Login
            </p>
          </div>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div>
          <h1>
            <span style={{ color: "#168BFF" }}>Connect</span> with your loved
            Ones
          </h1>
          <p>Cover a distance by NexMeet</p>
          <div role="button">
            <Link to={"/auth"}>Get Started</Link>
          </div>
        </div>
        <div>
          <img src="/mobile.png" alt="" />
        </div>
      </div>
    </div>
  );
}
