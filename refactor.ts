import { Project, SyntaxKind, TypeGuards, Node, VariableStatement } from 'ts-morph';
import * as fs from 'fs';

const project = new Project();
project.addSourceFilesAtPaths(['src/app/**/*.{ts,tsx}', 'src/components/ui/**/*.{ts,tsx}']);

const sourceFiles = project.getSourceFiles();

for (const sf of sourceFiles) {
  let changed = false;

  // 1. Ensure 'use strict'; is the first line
  const text = sf.getFullText();
  if (!text.startsWith("'use strict';") && !text.startsWith('"use strict";')) {
    sf.insertStatements(0, "'use strict';");
    changed = true;
  }

  // 2. Add JSDoc comments for exported components, functions, interfaces
  const exportedDeclarations = sf.getExportedDeclarations();
  for (const [name, decls] of exportedDeclarations) {
    for (const decl of decls) {
      if (
        Node.isFunctionDeclaration(decl) ||
        Node.isInterfaceDeclaration(decl) ||
        Node.isTypeAliasDeclaration(decl) ||
        Node.isClassDeclaration(decl) ||
        Node.isVariableDeclaration(decl)
      ) {
        // Find the topmost node to add JSDoc (for variables, it's the statement)
        let nodeToDoc = decl as any;
        if (Node.isVariableDeclaration(decl)) {
          nodeToDoc = decl.getVariableStatement();
        }

        if (nodeToDoc && nodeToDoc.getJsDocs && nodeToDoc.getJsDocs().length === 0) {
          try {
            nodeToDoc.addJsDoc({ description: `Exported ${Node.isVariableDeclaration(decl) ? 'component/variable' : nodeToDoc.getKindName().replace('Declaration', '').toLowerCase()} ${name}` });
            changed = true;
          } catch (e) {
            // Ignore errors if cannot add jsdoc
          }
        }
      }
    }
  }

  // 3. Replace inline styles (style={{ borderRadius: 2 }}) with equivalent Tailwind CSS classes
  // We will do string replacement after saving if needed, but doing it with AST is better
  const jsxElements = sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement);
  const selfClosingElements = sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
  
  for (const elem of [...jsxElements, ...selfClosingElements]) {
    const styleAttr = elem.getAttribute('style');
    if (styleAttr && Node.isJsxAttribute(styleAttr)) {
      const init = styleAttr.getInitializer();
      if (init && Node.isJsxExpression(init)) {
        const expr = init.getExpression();
        if (expr && Node.isObjectLiteralExpression(expr)) {
          const props = expr.getProperties();
          let newClasses: string[] = [];
          let remainingProps: string[] = [];
          
          for (const prop of props) {
            if (Node.isPropertyAssignment(prop)) {
              const pName = prop.getName();
              const pVal = prop.getInitializer()?.getText();
              
              if (pName === 'borderRadius' && pVal === '2') {
                newClasses.push('rounded-sm');
              } else if (pName === 'marginBottom' && pVal === '8') {
                newClasses.push('mb-2');
              } else if (pName === 'padding' && pVal === '16') {
                newClasses.push('p-4');
              } else if (pName === 'display' && pVal === '"flex"') {
                newClasses.push('flex');
              } else if (pName === 'marginTop' && pVal === '16') {
                newClasses.push('mt-4');
              } else if (pName === 'margin' && pVal === '0') {
                newClasses.push('m-0');
              } else if (pName === 'border' && pVal === '"1px solid #eee"') {
                newClasses.push('border border-gray-200');
              } else if (pName === 'cursor' && pVal === '"pointer"') {
                newClasses.push('cursor-pointer');
              } else if (pName === 'width' && pVal?.includes('`')) {
                // leave dynamic
                remainingProps.push(prop.getText());
              } else {
                remainingProps.push(prop.getText());
              }
            } else {
              remainingProps.push(prop.getText());
            }
          }

          if (newClasses.length > 0) {
            changed = true;
            let classNameAttr = elem.getAttribute('className');
            if (classNameAttr && Node.isJsxAttribute(classNameAttr)) {
              const classInit = classNameAttr.getInitializer();
              if (classInit && Node.isStringLiteral(classInit)) {
                classInit.replaceWithText(`"${classInit.getLiteralValue()} ${newClasses.join(' ')}"`);
              } else if (classInit && Node.isJsxExpression(classInit)) {
                // Ignore complex classNames
              }
            } else {
              elem.addAttribute({ name: 'className', initializer: `"${newClasses.join(' ')}"` });
            }

            if (remainingProps.length > 0) {
              styleAttr.replaceWithText(`style={{ ${remainingProps.join(', ')} }}`);
            } else {
              styleAttr.remove();
            }
          }
        }
      }
    }
  }

  if (changed) {
    sf.saveSync();
  }
}
