<!-- Sequential boxes: core -->

<script type="text/ng-template" id="sequential-boxes.html">
    <div ng-class="{'with-upload-first': fields[0].type == 'upload'}"
         class="sequential-boxes (( options.layout ))-layout">
        <div ui-sortable ng-model="data">
            <div ng-repeat="dataSet in data" class="sequential-box">
                <button ng-click="remove(dataSet)" class="button-icon button-delete" type="button">
                    <span class="dashicons dashicons-trash"></span>
                </button>

                <div ng-repeat="field in fields">
                    <ng-include src="(( 'field-' + field.type + '.html' ))"></ng-include>
                </div>
            </div>
        </div>

        <div ng-click="add()"
             ng-class="{clear: data.length % 3 == 0}"
             ng-hide="data.length >= options.max"
             class="sequential-box sequential-box-add">
            <div ng-repeat="field in fields">
                <ng-include src="(( 'field-' + field.type + '.html' ))"></ng-include>
            </div>

            <button class="button button-add" type="button">Ajouter</button>
        </div>
    </div>

    <input type="hidden" name="(( name ))" value="(( data ))">
</script>

<!-- Sequential boxes: fields -->

<script type="text/ng-template" id="field-text.html">
    <label>
        <strong>(( field.label ))</strong> <br>
        <input ng-model="dataSet[field.name]" type="text">
    </label>
</script>

<script type="text/ng-template" id="field-textarea.html">
    <label>
        <strong>(( field.label ))</strong> <br>
        <textarea ng-model="dataSet[field.name]"></textarea>
    </label>
</script>

<script type="text/ng-template" id="field-wysiwyg.html">
    <wp-editor options="(( field.options ))" ng-model="dataSet[field.name]"></wp-editor>
</script>

<script type="text/ng-template" id="field-upload.html">
    <upload-box options="(( field.options ))" ng-model="dataSet[field.name]"></upload-box>
</script>

<script type="text/ng-template" id="field-post.html">
    <post-box options="(( field.options ))" ng-model="dataSet[field.name]"></post-box>
</script>

<!-- WP Editor -->

<script type="text/ng-template" id="wp-editor.html">
    <div class="wp-core-ui wp-editor-wrap tmce-active">
        <link rel="stylesheet" id="editor-buttons-css" href="/wp-includes/css/editor.min.css?ver=4.1.1" type="text/css" media="all" />
        <div class="wp-editor-container">
            <textarea class="wp-editor-area"
                      rows="8"
                      autocomplete="off"
                      cols="40"
                      ng-model="(( text ))"></textarea>
        </div>
    </div>
</script>

<!-- Upload button -->

<script type="text/ng-template" id="upload-box.html">
    <div ng-click="openModal()" class="upload-box">
        <input ng-if="!binded" type="hidden" name="(( name ))" value="(( imageId ))">
        <img ng-show="imageId !== undefined" ng-src="(( imageUrl ))">
        <button ng-show="imageId === undefined" class="button" type="button">(( options.label ))</button>
    </div>
</script>

<!-- Post selector -->

<script type="text/ng-template" id="post-box.html">
    <div ng-class="{'without-label': options.hideLabel}" class="post-box">
        <input ng-if="!binded" type="hidden" name="(( name ))" value="(( post.id ))">

        <label>
            <strong>(( options.label )) <br></strong>

            <button ng-click="modal.open()" ng-disabled="loading" class="button-icon" type="button">
                <span class="dashicons dashicons-edit"></span>
            </button>

            <div ng-class="{'post-box-loading': loading}"
                 class="post-box-title"
                 title="(( post.title ))">
                <span class="spinner"></span>
                <span ng-if="post.title" ng-bind-html="post.title"></span>
                <em ng-if="!post.title">Aucun contenu lié</em>
            </div>
        </label>

        <!-- The wpLink API always needs an input to output the link -->
        <input ng-attr-id="(( inputId ))" type="text">
    </div>
</script>
