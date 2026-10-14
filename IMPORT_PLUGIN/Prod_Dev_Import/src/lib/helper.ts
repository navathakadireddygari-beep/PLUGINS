import React from "react";

export const reactIsInDevelopmentMode = (): boolean => {
    return '_self' in React.createElement('div');
}