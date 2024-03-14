import React from "react";
import { Container } from "semantic-ui-react";
import Head from "next/head";

//Layout component
//enables to render children to adapt the style
export default props => {
  return (
    <Container style={{ width: 650, border: 1 }}>
      <Head>
        <link
          rel="stylesheet"
          href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.3.3/semantic.min.css"
        />
      </Head>
      <style jsx global>{`
        body {
          background: #e6e6e6;
        }
      `}</style>

      {props.children}
    </Container>
  );
};
