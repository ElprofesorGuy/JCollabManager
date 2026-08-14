import { render } from '@testing-library/react';
import React from 'react';

// Un simple composant mock pour vérifier que le rendu fonctionne
const DummyComponent = () => {
    return <div>Hello Test</div>;
};

describe('Basic Test Suite', () => {
    it('should render the dummy component', () => {
        const { getByText } = render(<DummyComponent />);
        expect(getByText('Hello Test')).toBeInTheDocument();
    });
});
