import * as React from "react";
import { ActionFunction, Link, LinksFunction } from "remix";
import { Form, redirect, useActionData, useNavigate, useLocation } from "remix";
import { motion, AnimatePresence } from "framer-motion";
import { VisuallyHidden } from "@reach/visually-hidden";
import { DialogOverlay, DialogContent } from "@reach/dialog";
import dialogStyles from "@reach/dialog/styles.css";

export let links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: dialogStyles }];
};

type ActionData = { error: string };

export let action: ActionFunction = async ({
  request
}): Promise<Response | ActionData> => {
  let formData = await request.formData();
  let username = formData.get("username");
  let password = formData.get("password");
  if (username !== "kody" || password !== "remixrox") {
    return {
      error: `Invalid username or password. Use "kody" and "remixrox".`
    };
  }
  return redirect("/success");
};

const AnimatedDialogOverlay = motion(DialogOverlay);
const AnimatedDialogContent = motion(DialogContent);

let canUseDOM = typeof window !== "undefined";

export default function Login() {
  let navigate = useNavigate();
  let actionData = useActionData<ActionData>();
  let location = useLocation();

  const [renderInDialog] = React.useState(
    () => canUseDOM && !document.getElementById("modal-title")
  );
  const [showDialog, setShowDialog] = React.useState(false);

  React.useEffect(() => {
    setShowDialog(true);
  }, []);

  const close = () => {
    setShowDialog(false);
    setTimeout(() => {
      navigate(-1);
    }, 300);
  };

  let ui = (
    <>
      <h2 id="modal-title">Login</h2>
      <Link to="..">Go back</Link>
      <Form
        method="post"
        aria-describedby={actionData?.error ? "form-error" : undefined}
      >
        <div>
          <label htmlFor="username">Username</label>
          <input type="text" name="username" id="username" />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input type="password" name="password" id="password" />
        </div>
        <div>
          <button type="submit">Login</button>
        </div>
        {actionData?.error ? (
          <div role="alert" id="form-error" style={{ color: "red" }}>
            {actionData.error}
          </div>
        ) : null}
      </Form>
    </>
  );

  return renderInDialog ? (
    <AnimatePresence>
      {showDialog ? (
        <AnimatedDialogOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onDismiss={close}
        >
          <AnimatedDialogContent
            aria-labelledby="modal-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button className="close-button" onClick={close}>
              <VisuallyHidden>Close</VisuallyHidden>
              <span aria-hidden>×</span>
            </button>
            {ui}
          </AnimatedDialogContent>
        </AnimatedDialogOverlay>
      ) : null}
    </AnimatePresence>
  ) : (
    ui
  );
}
