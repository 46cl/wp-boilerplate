@font-face {
    font-family: '{{ name }}';
    src: url('{{ path }}/{{ name }}.eot');
    src: url('{{ path }}/{{ name }}.eot?#iefix') format('eot'),
        url('{{ path }}/{{ name }}.woff') format('woff'),
        url('{{ path }}/{{ name }}.ttf') format('truetype'),
        url('{{ path }}/{{ name }}.svg#{{ name }}') format('svg');
    font-weight: normal;
    font-style: normal;
}

.{{ name }} {
    display: inline-block;
}

.{{ name }}::before {
    display: inline-block;
    font-family: '{{ name }}';
    font-style: normal;
    font-weight: normal;
    line-height: 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

{% for glyph in glyphs %}
.{{ name }}-{{ glyph.name }}::before {
    content: '\{{ glyph.codepoint.toString(16) }}';
}
{% endfor %}
