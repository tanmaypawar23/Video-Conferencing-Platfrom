import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const withAuth = (WrappedComponent) => {
  const AuthComponend = (props) => {
    const router = useNavigate();

    const isAuthenticaticated = () => {
      if (localStorage.getItem("token")) {
        return true;
      }
      return false;
    };

    useEffect(() => {
      if (!isAuthenticaticated()) {
        router("/auth");
      }
    }, []);

    return <WrappedComponent {...props} />;
  };
  return AuthComponend;
};

export default withAuth;
