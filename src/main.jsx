import React from "react";
import ReactDOM from "react-dom";
import { ChakraProvider } from "@chakra-ui/react";
import Index from "./pages/Index";

ReactDOM.render(
  <ChakraProvider>
    <Index />
  </ChakraProvider>,
  document.getElementById("root"),
);
