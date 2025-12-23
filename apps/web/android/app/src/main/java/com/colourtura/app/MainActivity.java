package com.colourtura.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Configure WebView for Web3 compatibility
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebSettings webSettings = this.bridge.getWebView().getSettings();

            // Enable JavaScript (required for Web3)
            webSettings.setJavaScriptEnabled(true);

            // Enable DOM storage (required for Web3 wallets)
            webSettings.setDomStorageEnabled(true);

            // Enable database storage (required for Web3 wallets)
            webSettings.setDatabaseEnabled(true);

            // Allow mixed content (HTTPS pages loading HTTP resources)
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

            // Enable caching for better performance
            webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
            webSettings.setAppCacheEnabled(true);

            // Enable zoom controls (optional)
            webSettings.setSupportZoom(false);
            webSettings.setBuiltInZoomControls(false);
            webSettings.setDisplayZoomControls(false);

            // Allow file access (may be needed for some Web3 operations)
            webSettings.setAllowFileAccess(true);
            webSettings.setAllowContentAccess(true);

            // Enable hardware acceleration
            this.bridge.getWebView().setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null);
        }
    }
}
