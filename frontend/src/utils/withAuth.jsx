import { Navigate } from "react-router-dom";

const withAuth = (WrappedComponent) => {
  const AuthComponent = (props) => {
    if (!localStorage.getItem("token")) {
      return <Navigate to="/auth" replace />;
    }

    return <WrappedComponent {...props} />;
  };
  return AuthComponent;
};

export default withAuth;
