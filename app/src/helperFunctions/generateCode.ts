import { element } from 'prop-types';
import {
  Component,
  State,
  ChildElement,
  HTMLType
} from '../interfaces/Interfaces';

declare global {
  interface Window {
    api: any;
  }
}

// generate code based on the component hierarchy
const generateUnformattedCode = (
  comps: Component[],
  componentId: number,
  rootComponents: number[],
  projectType: string,
  HTMLTypes: HTMLType[]
) => {
  const components = [...comps];

  // find the component that we're going to generate code for
  const currentComponent = components.find(elem => elem.id === componentId);
  // find the unique components that we need to import into this component file
  let imports: any = [];
  let providers: string = '';
  let context: string = '';
  let links: boolean = false;

  const isRoot = rootComponents.includes(componentId);

  // returns an array of objects which may include components, html elements, and/or route links
  const getEnrichedChildren = (currentComponent: Component | ChildElement) => {
    // declare an array of enriched children

    const enrichedChildren = currentComponent.children.map((elem: any) => {
      //enrichedChildren is iterating through the children array
      const child = { ...elem };

      // check if child is a component
      if (child.type === 'Component') {
        // verify that the child is in the components array in state
        const referencedComponent = components.find(
          elem => elem.id === child.typeId
        );
        // check if imports array include the referenced component, if not, add its name to the imports array (e.g. the name/tag of the component/element)
        if (!imports.includes(referencedComponent.name))
          imports.push(referencedComponent.name);
        child['name'] = referencedComponent.name;
        return child;
      } else if (child.type === 'HTML Element') {
        const referencedHTML = HTMLTypes.find(elem => elem.id === child.typeId);
        child['tag'] = referencedHTML.tag;
        if (
          referencedHTML.tag === 'div' ||
          referencedHTML.tag === 'separator' ||
          referencedHTML.tag === 'form' ||
          referencedHTML.tag === 'ul' ||
          referencedHTML.tag === 'ol' ||
          referencedHTML.tag === 'menu' ||
          referencedHTML.tag === 'li' ||
          referencedHTML.tag === 'LinkTo' ||
          referencedHTML.tag === 'Switch' ||
          referencedHTML.tag === 'Route'
        ) {
          child.children = getEnrichedChildren(child);
        }
        // when we see a Switch or LinkTo, import React Router
        if (referencedHTML.tag === 'Switch' || referencedHTML.tag === 'LinkTo')
          importReactRouter = true;
        return child;
      } else if (child.type === 'Route Link') {
        links = true;
        child.name = components.find(
          (comp: Component) => comp.id === child.typeId
        ).name;
        return child;
      }
      });
      return enrichedChildren;
  };
  // Raised formatStyles so that it is declared before it is referenced. It was backwards.
  // format styles stored in object to match React inline style format
  const formatStyles = (styleObj: any) => {
    if (Object.keys(styleObj).length === 0) return ``;
    const formattedStyles = [];
    let styleString;
    for (let i in styleObj) {
      if(i === 'style') {
        styleString = i + ':' + JSON.stringify(styleObj[i]);
        formattedStyles.push(styleString);
      }
    }
    return formattedStyles;
  };

  // function to dynamically add classes, ids, and styles to an element if it exists.
  const elementTagDetails = (childElement: object) => {
    let customizationDetails = "";
    if (childElement.childId && childElement.tag !== 'Route') customizationDetails += (' ' + `id="${+childElement.childId}"`);
    if (childElement.attributes && childElement.attributes.cssClasses) {
      customizationDetails += (' ' + `className="${childElement.attributes.cssClasses}"`);
    }
    if (childElement.style && Object.keys(childElement.style).length > 0) customizationDetails +=(' ' + formatStyles(childElement));
    return customizationDetails;
  };

  // function to fix the spacing of the ace editor for new lines of added content. This was breaking on nested components, leaving everything right justified.
  const tabSpacer = (level: number) => {
    let tabs = ''
    for (let i = 0; i < level; i++) tabs += '  ';
    return tabs;
  }

  // function to dynamically generate the appropriate levels for the code preview
  const levelSpacer = (level: number, spaces: number) => {
    if (level === 2 ) return `\n${tabSpacer(spaces)}`;
    else return ''
  }

  // function to dynamically generate a complete html (& also other library type) elements
  const elementGenerator = (childElement: object, level: number = 2) => {
    let result = '';

    let innerText = '';
    let activeLink = '';
    

    if (childElement.attributes && childElement.attributes.compText) {
      if (childElement.stateUsed && childElement.stateUsed.compText) {
        if (childElement.stateUsed.compText.stateKey) {
          innerText = '{' + childElement.stateUsed.compText.stateKey + '}';
        } else {
          innerText = '{' + childElement.stateUsed.compText + '}';
        }
      } else {
        innerText = childElement.attributes.compText;
      }
    }
    if (childElement.attributes && childElement.attributes.compLink) {
      if (childElement.stateUsed && childElement.stateUsed.compLink) {
        activeLink = '{' + childElement.stateUsed.compLink + '}';
      } else {
        activeLink = '"' +childElement.attributes.compLink + '"';
      }
    }
    const nestable = childElement.tag === 'div' ||
    childElement.tag === 'form' ||
    childElement.tag === 'ol' ||
    childElement.tag === 'ul' ||
    childElement.tag === 'menu' ||
    childElement.tag === 'li' ||
    childElement.tag === 'Switch' ||
    childElement.tag === 'Route';

    const compTextForEach = childElement.stateUsed && childElement.stateUsed.compText && childElement.stateUsed.compText.stateArray
    if (compTextForEach) {
      // get array key 
      const arrayKey = childElement.stateUsed.compText.stateKey.split('[')[0];
      result += `for (let i = 0; i <${arrayKey}.length; i++) {
        `;
      // console.log("['abc','xyz']".replace(/[\[\]']+/g,''));
    }


    if (childElement.tag === 'img') {
      result += `${levelSpacer(level, 5)}<${childElement.tag} src=${activeLink} ${elementTagDetails(childElement)}/>${levelSpacer(2, (3 + level))}`;
    } else if (childElement.tag === 'a') {
      result +=  `${levelSpacer(level, 5)}<${childElement.tag} href=${activeLink} ${elementTagDetails(childElement)}>${innerText}</${childElement.tag}>${levelSpacer(2, (3 + level))}`;
    } else if (childElement.tag === 'input') {
      result += `${levelSpacer(level, 5)}<${childElement.tag}${elementTagDetails(childElement)}></${childElement.tag}>${levelSpacer(2, (3 + level))}`;
    } else if (childElement.tag === 'LinkTo') {
      result += `${levelSpacer(level, 5)}<Link to=${activeLink}${elementTagDetails(childElement)}>${innerText}
        ${tabSpacer(level)}${writeNestedElements(childElement.children, level + 1)}
        ${tabSpacer(level - 1)}</Link>${levelSpacer(2, (3 + level))}`;
    } else if (nestable) {
      const routePath = (childElement.tag === 'Route') ? (' ' + 'exact path=' + activeLink) : '';
      result += `${levelSpacer(level, 5)}<${childElement.tag}${elementTagDetails(childElement)}${routePath}>${innerText}
        ${tabSpacer(level)}${writeNestedElements(childElement.children, level + 1)}
        ${tabSpacer(level - 1)}</${childElement.tag}>${levelSpacer(2, (3 + level))}`;
    } else if (childElement.tag !== 'separator'){
      result += `${levelSpacer(level, 5)}<${childElement.tag}${elementTagDetails(childElement)}>${innerText}</${childElement.tag}>${levelSpacer(2, (3 + level))}`;
    }

    if (compTextForEach) result += '}';
    return result; 
  }

  // write all code that will be under the "return" of the component
  const writeNestedElements = (enrichedChildren: any, level: number = 2) => {
    return `${enrichedChildren
              .map((child: any) => {
                if (child.type === 'Component') {
                  return `<${child.name} ${elementTagDetails(child)} />`;
                } else if (child.type === 'HTML Element') {
                  return elementGenerator(child, level);
                }
                // route links are for gatsby.js and next.js feature. if the user creates a route link and then switches projects, generate code for a normal link instead
                else if (child.type === 'Route Link') {
                  if (projectType === 'Next.js') {
                    // if route link points to index, to go endpoint / rather than /index
                    if (child.name === 'index') return `<div><Link href="/"><a>${child.name}</a></Link></div>`;
                    else return `<div><Link href="/${child.name}"><a>${child.name}</a></Link></div>`;
                  } else if (projectType === 'Gatsby.js') {
                    if (child.name === 'index') return `<div><Link to="/">${child.name}</Link></div>`;
                    else return `<div><Link to="/${child.name}">${child.name}</Link></div>`;
                  } else return `<div><a>${child.name}</a></div>`
                }
              })
              .filter(element => !!element)
              .join('')
            }`;
  };

  // function to properly incorporate the user created state that is stored in the application state
  const writeStateProps = (stateArray: any) => {
    let stateToRender = '';
    for (const element of stateArray) {
      stateToRender += levelSpacer(2, 3) + element + ';'
    }
    return stateToRender
  }

  const enrichedChildren: any = getEnrichedChildren(currentComponent);

  const next = true;

  // import statements differ between root (pages) and regular components (components)
  const importsMapped =
    projectType === 'Next.js' || projectType === 'Gatsby.js'
      ? imports
          .map((comp: string) => {
            return isRoot
              ? `import ${comp} from '../components/${comp}'`
              : `import ${comp} from './${comp}'`;
          })
          .join('\n')
      : imports
          .map((comp: string) => {
            return `import ${comp} from './${comp}'`;
          })
          .join('\n');

  const stateful = true;
  const classBased = false;
  let importReactRouter;

  const createState = (stateProps) => {
    let state = '{';

    stateProps.forEach((ele) => {
      state += ele.key + ':' + JSON.stringify(ele.value) + ', ';
    });

    state = state.substring(0, state.length - 2) + '}';

    return state;
  }
  // check for context
  if (currentComponent.useContext) {

    for (const providerId of Object.keys(currentComponent.useContext)) {
      const attributesAndStateIds = currentComponent.useContext[String(providerId)]; //currently just from App
      const providerComponent = components[providerId - 1];
      providers += 'const ' + providerComponent.name.toLowerCase() + 'Context = useContext(' + providerComponent.name + 'Context);\n';

      for (const stateId of Object.values(attributesAndStateIds)) {
        context +=
          'const ' +
          providerComponent.stateProps[stateId - 1].key +
          ' = ' +
          providerComponent.name.toLowerCase() +
          'Context.' +
          providerComponent.stateProps[stateId - 1].key +
          ';\n';
      }
    }
  }

  // create final component code. component code differs between classic react, next.js, gatsby.js
  // classic react code
  if (projectType === 'Classic React') {
    return `
    ${stateful && !classBased ? `import React, { useState, createContext, useContext } from 'react';` : ''}
    ${importReactRouter ? `import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';`: ``}
    ${classBased ? `import React, { Component } from 'react';` : ''}
    ${!stateful && !classBased ? `import React, { createContext, useContext } from 'react';` : ''}
    ${importsMapped}
    ${providers}
    ${context}
    ${
      classBased
        ? `class ${currentComponent.name} extends Component {`
        : `const ${currentComponent.name} = (props: any): JSX.Element => {`
    }
    ${
      stateful && !classBased
        ? `const [value, setValue] = useState<any | undefined>("INITIAL VALUE");${writeStateProps(currentComponent.useStateCodes)}
        `
        : ``
    }
    ${
      isRoot  && currentComponent.stateProps.length !== 0
      ? `const ${currentComponent.name}Context = createContext(${createState(currentComponent.stateProps)});`
      : ``

    }
    ${
      classBased && stateful
        ? `constructor(props) {
      super(props);
      this.state = {}
      }`
        : ``
    }
    ${classBased ? `render(): JSX.Element {` : ``}
    ${!importReactRouter ?
    `return (
      <${currentComponent.name}Context.Provider value="">
        <div className="${currentComponent.name}" ${formatStyles(currentComponent)}>
          ${writeNestedElements(enrichedChildren)}
        </div>
      </${currentComponent.name}Context.Provider>
    );` : `return (
      <${currentComponent.name}Context.Provider value="">
        <Router>
          <div className="${currentComponent.name}" ${formatStyles(currentComponent)}>
            ${writeNestedElements(enrichedChildren)}
          </div>
        </Router>
      </${currentComponent.name}Context.Provider>
    );`}
    ${`}`}
    export default ${currentComponent.name};
    `;
  }
  // next.js component code
  else if (projectType === 'Next.js') {
    return `
    import React, { useState } from 'react';
    ${importsMapped}
    import Head from 'next/head'
    ${links ? `import Link from 'next/link'` : ``}

    const ${currentComponent.name} = (props): JSX.Element => {

      const  [value, setValue] = useState<any | undefined>("INITIAL VALUE");

      return (
      <>
      ${
        isRoot
          ? `<Head>
            <title>${currentComponent.name}</title>
            </Head>`
          : ``
      }
      <div className="${currentComponent.name}" style={props.style}>
      ${writeNestedElements(enrichedChildren)}
      </div>
      </>
      );
    }

    export default ${currentComponent.name};
    `;
  } else {
    // gatsby component code
    return `
    import React, { useState } from 'react';
    ${importsMapped}
    import { StaticQuery, graphql } from 'gatsby';
    ${links ? `import { Link } from 'gatsby'` : ``}


      const ${currentComponent.name} = (props: any): JSX.Element => {

      const[value, setValue] = useState<any | undefined>("INITIAL VALUE");

      return (
        <>
        ${
          isRoot
            ? `<head>
              <title>${currentComponent.name}</title>
              </head>`
            : ``
        }
        <div className="${currentComponent.name}" style={props.style}>
        ${writeNestedElements(enrichedChildren)}
        </div>
        </>
        );
      }

      export default ${currentComponent.name};
    `;
  }
};

// formats code with prettier linter
const formatCode = (code: string) => {
  // in test environment, window.api is not defined,
  // so we reference original prettier format function instead
  if (process.env.NODE_ENV === 'test') {
    const { format } = require('prettier');
    return format(code, {
      singleQuote: true,
      trailingComma: 'es5',
      bracketSpacing: true,
      jsxBracketSameLine: true,
      parser: 'babel'
    });
  } else if (process.env.NODE_ENV === 'production') {
    return window.api.formatCode(code);
  } else {
    return code;
  }
};

// generate code based on component hierarchy and then return the rendered code
const generateCode = (
  components: Component[],
  componentId: number,
  rootComponents: number[],
  projectType: string,
  HTMLTypes: HTMLType[]
) => {
  const code = generateUnformattedCode(
    components,
    componentId,
    rootComponents,
    projectType,
    HTMLTypes
  );
  return formatCode(code);
};

export default generateCode;
