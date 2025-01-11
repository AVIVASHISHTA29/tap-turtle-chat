"use client";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

const ProgressProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <ProgressBar
        height="2px"
        color="#fff"
        options={{ showSpinner: false }}
        shallowRouting={true}
      />
      {children}
    </>
  );
};

export default ProgressProvider;
